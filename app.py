from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__, instance_relative_config=True)

# Ensure instance folder exists for SQLite file
os.makedirs(app.instance_path, exist_ok=True)

db_path = os.path.join(app.instance_path, "valentines.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class Wish(db.Model):
    __tablename__ = "wishes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=True)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name or "Someone",
            "message": self.message,
            "created_at": self.created_at.strftime("%d %b %Y %I:%M %p"),
        }


@app.route("/")
def home():
    return render_template("index.html", title="Valentine Wishes 💌")


@app.route("/wishes", methods=["GET", "POST"])
def wishes():
    # Fallback: normal form submission
    if request.method == "POST":
        name = (request.form.get("name") or "").strip()
        message = (request.form.get("message") or "").strip()

        if message:
            if len(message) > 300:
                message = message[:300]
            if len(name) > 100:
                name = name[:100]

            wish = Wish(name=name if name else None, message=message)
            db.session.add(wish)
            db.session.commit()

        return redirect(url_for("wishes"))

    all_wishes = Wish.query.order_by(Wish.created_at.desc()).all()
    return render_template("wishes.html", title="Wishes Wall 💌", wishes=all_wishes)


@app.route("/api/wishes", methods=["POST"])
def add_wish():
    # AJAX endpoint
    data = request.get_json() or {}

    name = (data.get("name") or "").strip()
    message = (data.get("message") or "").strip()

    if not message:
        return jsonify({"success": False, "error": "Message cannot be empty."}), 400

    if len(message) > 300:
        return jsonify({"success": False, "error": "Message too long"}), 400

    if len(name) > 100:
        name = name[:100]

    wish = Wish(name=name if name else None, message=message)
    db.session.add(wish)
    db.session.commit()

    return jsonify({"success": True, "wish": wish.to_dict()}), 201


# DELETE WISH (super reliable)
@app.route("/wishes/<int:wish_id>/delete", methods=["POST"])
def delete_wish_form(wish_id):
    wish = Wish.query.get_or_404(wish_id)
    db.session.delete(wish)
    db.session.commit()
    return redirect(url_for("wishes"))


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
