from ..extensions import db


class Resolution(db.Model):
    __tablename__ = 'resolutions'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(400), nullable=False)

    def to_dict(self):
        return {'id': self.id, 'title': self.title}

    def __repr__(self):
        return f'<Resolution {self.title[:30]}>'
