export function eligibleReview(reviews, sha, author) {
  const latest = new Map();
  for (const r of reviews) {
    if (['APPROVED','CHANGES_REQUESTED','DISMISSED'].includes(r.state)) latest.set(r.user.login,r);
  }
  if ([...latest.values()].some(r=>r.state==='CHANGES_REQUESTED')) return [];
  return [...latest.values()].filter(r=>r.state==='APPROVED' && r.commit_id===sha && r.user.type==='User' && r.user.login!==author);
}
export default async function merge({github,context,core}) {
  const repo=context.repo;
  const numbers=context.payload.pull_request ? [context.payload.pull_request.number] :
    process.env.PR_NUMBER ? [Number(process.env.PR_NUMBER)] :
    (await github.paginate(github.rest.pulls.list,{...repo,state:'open',base:'master',per_page:100})).map(p=>p.number);
  const workflow=(await github.rest.actions.getWorkflow({...repo,workflow_id:'spec-tests.yml'})).data;
  for (const pull_number of numbers) {
    const pr=(await github.rest.pulls.get({...repo,pull_number})).data;
    if(pr.state!=='open'||pr.draft||pr.base.ref!=='master'||pr.head.repo?.full_name!==pr.base.repo.full_name||!pr.head.ref.startsWith('copilot/')||!['Copilot','copilot-swe-agent[bot]'].includes(pr.user.login)) continue;
    const files=await github.paginate(github.rest.pulls.listFiles,{...repo,pull_number,per_page:100});
    if(!files.length||files.length!==pr.changed_files||files.some(f=>!/^tests\/e2e\/ai-agent\/food-grandma-fastapi\/tests\/generated\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_./-]+\.(ts|md|json)$/.test(f.filename)||!['added','modified'].includes(f.status))) continue;
    const reviews=await github.paginate(github.rest.pulls.listReviews,{...repo,pull_number,per_page:100});
    let approved=false;
    for(const r of eligibleReview(reviews,pr.head.sha,pr.user.login)) {
      const p=(await github.rest.repos.getCollaboratorPermissionLevel({...repo,username:r.user.login})).data;
      if(['admin','write','maintain'].includes(p.permission)) approved=true;
    }
    if(!approved) {core.notice(`#${pull_number}: waiting for human approval of current HEAD`);continue;}
    const runs=await github.paginate(github.rest.actions.listWorkflowRuns,{...repo,workflow_id:workflow.id,branch:pr.head.ref,per_page:100});
    // PR runs test the merge ref. GitHub records head_sha as the PR head SHA.
    const current=runs.filter(r=>r.head_sha===pr.head.sha && r.event==='pull_request').sort((a,b)=>b.id-a.id);
    if(!current.length||current[0].status!=='completed'||current[0].conclusion!=='success') continue;
    const comparison=(await github.rest.repos.compareCommitsWithBasehead({...repo,basehead:`master...${pr.head.sha}`})).data;
    if(comparison.behind_by!==0) {core.notice(`#${pull_number}: update branch from master and rerun tests/review`);continue;}
    const fresh=(await github.rest.pulls.get({...repo,pull_number})).data;
    if(fresh.head.sha!==pr.head.sha||fresh.base.sha!==pr.base.sha||fresh.draft||fresh.mergeable!==true) continue;
    await github.rest.pulls.merge({...repo,pull_number,sha:pr.head.sha,merge_method:'squash'});
    core.notice(`Merged #${pull_number} after passing tests and human approval`);
  }
}
