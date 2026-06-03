from ..extensions import db


class Committee(db.Model):
    __tablename__ = 'committees'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)

    def to_dict(self):
        return {'id': self.id, 'name': self.name}

    def __repr__(self):
        return f'<Committee {self.name}>'
