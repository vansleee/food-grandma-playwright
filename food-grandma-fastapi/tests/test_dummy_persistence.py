"""Run with DATABASE_URL pointing to an isolated SQLite file."""
import unittest
import tempfile
from unittest.mock import patch
from sqlmodel import Session, SQLModel, select, create_engine
from app.database import engine, DATABASE_URL
from app.models import Restaurant, Meal, Order, COOKING, READY, ONTHEWAY, DELIVERED
from app.dummy_data import rebuild_dummy_data, initialize_demo_if_empty

class DummyPersistenceTests(unittest.TestCase):
    def setUp(self):
        SQLModel.metadata.drop_all(engine)
        SQLModel.metadata.create_all(engine)

    def test_rebuild_complete_and_repeatable(self):
        with Session(engine) as session:
            summary = rebuild_dummy_data(session)
            self.assertEqual(summary['restaurants'], 6)
            self.assertEqual(summary['meals'], 22)
            self.assertEqual(set(o.status for o in session.exec(select(Order)).all()), {COOKING, READY, ONTHEWAY, DELIVERED})
            self.assertTrue(all(m.image.startswith('https://images.unsplash.com/') for m in session.exec(select(Meal)).all()))
            self.assertEqual(rebuild_dummy_data(session), summary)

    def test_restart_preserves_edits_on_disk(self):
        with tempfile.TemporaryDirectory() as directory:
            url = f'sqlite:///{directory}/persistent.db'
            first_engine = create_engine(url)
            SQLModel.metadata.create_all(first_engine)
            with Session(first_engine) as session:
                self.assertTrue(initialize_demo_if_empty(session))
                restaurant = session.exec(select(Restaurant)).first()
                restaurant.name = 'Preserved after restart'
                session.add(restaurant)
                session.commit()
            first_engine.dispose()
            restarted_engine = create_engine(url)
            with Session(restarted_engine) as session:
                self.assertFalse(initialize_demo_if_empty(session))
                self.assertEqual(session.exec(select(Restaurant)).first().name, 'Preserved after restart')
            restarted_engine.dispose()

    def test_failure_rolls_back_reset(self):
        with Session(engine) as session:
            rebuild_dummy_data(session)
            restaurant = session.exec(select(Restaurant)).first()
            restaurant.name = 'Must survive failed rebuild'
            session.add(restaurant)
            session.commit()
            before = [(o.id, o.status, o.total) for o in session.exec(select(Order)).all()]
            with patch('app.dummy_data.add_dummy_catalog', side_effect=RuntimeError('injected failure')):
                with self.assertRaises(RuntimeError):
                    rebuild_dummy_data(session)
            self.assertEqual(session.exec(select(Restaurant)).first().name, 'Must survive failed rebuild')
            self.assertEqual([(o.id, o.status, o.total) for o in session.exec(select(Order)).all()], before)

    def test_legacy_seed_builds_complete_catalog(self):
        from app.routers.demo_data import test_seed
        with Session(engine) as session:
            result = test_seed(session)
            self.assertEqual(result['restaurants'], 6)
            self.assertEqual(result['meals'], 22)
            self.assertEqual(set(result['order_states']), {'Cooking', 'Ready', 'On the way', 'Delivered'})
            self.assertTrue(all(r.logo.startswith('https://images.unsplash.com/') for r in session.exec(select(Restaurant)).all()))

if __name__ == '__main__':
    unittest.main()
