import json
from pathlib import Path
import sqlite3
import sys

database, username = sys.argv[1:]
with sqlite3.connect(Path(database).resolve().as_uri() + '?mode=ro', uri=True) as connection:
    connection.row_factory = sqlite3.Row
    rows = connection.execute(
        '''
        SELECT o.id, o.restaurant_id, o.address, o.total, d.meal_id, d.quantity
        FROM "order" AS o
        JOIN customer AS c ON c.id = o.customer_id
        JOIN "user" AS u ON u.id = c.user_id
        LEFT JOIN orderdetails AS d ON d.order_id = o.id
        WHERE u.username = ?
        ORDER BY o.id
        ''',
        (username,),
    ).fetchall()
print(json.dumps([dict(row) for row in rows]))
