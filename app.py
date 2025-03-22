from flask import Flask, render_template, request, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Table, Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hierarchy.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Association tables for many-to-many relationships
goals_values = Table('goals_values', db.Model.metadata,
    Column('goal_id', Integer, ForeignKey('goal.id'), primary_key=True),
    Column('value_id', Integer, ForeignKey('value.id'), primary_key=True)
)

metrics_goals = Table('metrics_goals', db.Model.metadata,
    Column('metric_id', Integer, ForeignKey('metric.id'), primary_key=True),
    Column('goal_id', Integer, ForeignKey('goal.id'), primary_key=True)
)

# Models
class Value(db.Model):
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    goals = relationship('Goal', secondary=goals_values, back_populates='values')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': 'value',
            'goal_ids': [goal.id for goal in self.goals]
        }

class Goal(db.Model):
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    values = relationship('Value', secondary=goals_values, back_populates='goals', lazy='joined')
    metrics = relationship('Metric', secondary=metrics_goals, back_populates='goals', lazy='joined')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'type': 'goal',
            'value_ids': [value.id for value in self.values],
            'metric_ids': [metric.id for metric in self.metrics]
        }

class Metric(db.Model):
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    goals = relationship('Goal', secondary=metrics_goals, back_populates='metrics')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': 'metric',
            'goal_ids': [goal.id for goal in self.goals]
        }

# Routes
@app.route('/')
def index():
    return render_template('index.html')

# API Endpoints
@app.route('/api/hierarchy', methods=['GET'])
def get_hierarchy():
    values = Value.query.all()
    goals = Goal.query.all()
    metrics = Metric.query.all()
    
    # Add debug logging
    print("Goals data:", [goal.to_dict() for goal in goals])
    
    return jsonify({
        'values': [value.to_dict() for value in values],
        'goals': [goal.to_dict() for goal in goals],
        'metrics': [metric.to_dict() for metric in metrics]
    })

@app.route('/api/value', methods=['POST'])
def create_value():
    data = request.json
    if not data or 'name' not in data:
        abort(400, description="Name is required")
    
    value = Value(name=data['name'])
    db.session.add(value)
    db.session.commit()
    
    return jsonify(value.to_dict()), 201

@app.route('/api/goal', methods=['POST'])
def create_goal():
    data = request.json
    if not data or 'name' not in data:
        abort(400, description="Name is required")
    
    goal = Goal(name=data['name'], description=data.get('description', ''))
    
    # Link to values
    if 'value_ids' in data and data['value_ids']:
        values = Value.query.filter(Value.id.in_(data['value_ids'])).all()
        goal.values = values
    
    db.session.add(goal)
    db.session.commit()
    
    return jsonify(goal.to_dict()), 201

@app.route('/api/metric', methods=['POST'])
def create_metric():
    data = request.json
    if not data or 'name' not in data:
        abort(400, description="Name is required")
    
    metric = Metric(name=data['name'])
    
    # Link to goals
    if 'goal_ids' in data and data['goal_ids']:
        goals = Goal.query.filter(Goal.id.in_(data['goal_ids'])).all()
        metric.goals = goals
    
    db.session.add(metric)
    db.session.commit()
    
    return jsonify(metric.to_dict()), 201

@app.route('/api/<item_type>/<int:id>', methods=['DELETE'])
def delete_item(item_type, id):
    if item_type == 'value':
        item = Value.query.get_or_404(id)
    elif item_type == 'goal':
        item = Goal.query.get_or_404(id)
    elif item_type == 'metric':
        item = Metric.query.get_or_404(id)
    else:
        abort(400, description="Invalid item type")
    
    db.session.delete(item)
    db.session.commit()
    
    return jsonify({'message': f'{item_type.capitalize()} deleted successfully'}), 200

@app.route('/api/connections', methods=['PUT'])
def update_connections():
    data = request.json
    if not data or 'item_type' not in data or 'item_id' not in data:
        abort(400, description="Item type and ID are required")
    
    item_type = data['item_type']
    item_id = data['item_id']
    
    if item_type == 'value':
        item = Value.query.get_or_404(item_id)
        if 'goal_ids' in data:
            goals = Goal.query.filter(Goal.id.in_(data['goal_ids'])).all()
            item.goals = goals
    elif item_type == 'goal':
        item = Goal.query.get_or_404(item_id)
        if 'value_ids' in data:
            values = Value.query.filter(Value.id.in_(data['value_ids'])).all()
            item.values = values
        if 'metric_ids' in data:
            metrics = Metric.query.filter(Metric.id.in_(data['metric_ids'])).all()
            item.metrics = metrics
    elif item_type == 'metric':
        item = Metric.query.get_or_404(item_id)
        if 'goal_ids' in data:
            goals = Goal.query.filter(Goal.id.in_(data['goal_ids'])).all()
            item.goals = goals
    else:
        abort(400, description="Invalid item type")
    
    db.session.commit()
    
    return jsonify(item.to_dict()), 200

@app.route('/api/reset', methods=['POST'])
def reset_data():
    db.session.query(Metric).delete()
    db.session.query(Goal).delete()
    db.session.query(Value).delete()
    db.session.commit()
    
    return jsonify({'message': 'All data reset successfully'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True) 