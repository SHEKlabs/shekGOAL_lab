from flask import Flask, render_template, request, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Table, Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hierarchy.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Delete database file if it exists to rebuild schema
db_file = 'hierarchy.db'
if os.path.exists(db_file):
    os.remove(db_file)
    print(f"Deleted existing database: {db_file}")

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
    description = Column(Text)
    goals = relationship('Goal', secondary=goals_values, back_populates='values', lazy='joined')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'type': 'value',
            'goal_ids': [goal.id for goal in self.goals]
        }

class Goal(db.Model):
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
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
    description = Column(Text)
    goals = relationship('Goal', secondary=metrics_goals, back_populates='metrics', lazy='joined')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
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
    
    # Print debug info
    print("----- Hierarchy Data -----")
    print(f"Values: {len(values)}")
    print(f"Goals: {len(goals)}")
    print(f"Metrics: {len(metrics)}")
    
    # Prepare detailed data
    value_data = []
    for value in values:
        value_dict = value.to_dict()
        value_dict['goals'] = [{'id': goal.id, 'name': goal.name} for goal in value.goals]
        value_data.append(value_dict)
    
    goal_data = []
    for goal in goals:
        goal_dict = goal.to_dict()
        goal_dict['values'] = [{'id': value.id, 'name': value.name} for value in goal.values]
        goal_dict['metrics'] = [{'id': metric.id, 'name': metric.name} for metric in goal.metrics]
        goal_data.append(goal_dict)
    
    metric_data = []
    for metric in metrics:
        metric_dict = metric.to_dict()
        metric_dict['goals'] = [{'id': goal.id, 'name': goal.name} for goal in metric.goals]
        metric_data.append(metric_dict)
    
    return jsonify({
        'values': value_data,
        'goals': goal_data,
        'metrics': metric_data
    })

@app.route('/api/value', methods=['POST'])
def create_value():
    data = request.get_json()
    value = Value(name=data['name'], description=data.get('description', ''))
    db.session.add(value)
    db.session.commit()
    
    print(f"✓ VALUE ADDED: {value.name} (ID: {value.id})")
    print(f"  Description: {value.description}")
    
    return jsonify(value.to_dict())

@app.route('/api/goal', methods=['POST'])
def create_goal():
    data = request.get_json()
    goal = Goal(name=data['name'], description=data.get('description', ''))
    if 'value_ids' in data:
        values = Value.query.filter(Value.id.in_(data['value_ids'])).all()
        goal.values = values
    db.session.add(goal)
    db.session.commit()
    
    print(f"✓ GOAL ADDED: {goal.name} (ID: {goal.id})")
    print(f"  Description: {goal.description}")
    print(f"  Connected to values: {[value.name for value in goal.values]}")
    
    return jsonify(goal.to_dict())

@app.route('/api/metric', methods=['POST'])
def create_metric():
    data = request.get_json()
    metric = Metric(name=data['name'], description=data.get('description', ''))
    if 'goal_ids' in data:
        goals = Goal.query.filter(Goal.id.in_(data['goal_ids'])).all()
        metric.goals = goals
    db.session.add(metric)
    db.session.commit()
    
    print(f"✓ METRIC ADDED: {metric.name} (ID: {metric.id})")
    print(f"  Description: {metric.description}")
    print(f"  Connected to goals: {[goal.name for goal in metric.goals]}")
    
    return jsonify(metric.to_dict())

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
    
    print(f"✓ {item_type.upper()} DELETED: ID {id}")
    
    return jsonify({'message': f'{item_type} deleted successfully'}), 200

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
    
    print("✓ ALL DATA RESET")
    
    return jsonify({'message': 'All data reset successfully'}), 200

@app.route('/api/<item_type>/<int:item_id>', methods=['PUT'])
def update_item(item_type, item_id):
    data = request.get_json()
    
    if item_type == 'value':
        item = Value.query.get_or_404(item_id)
        item.name = data['name']
        item.description = data.get('description', '')
        if 'connections' in data:
            goals = Goal.query.filter(Goal.id.in_(data['connections'])).all()
            item.goals = goals
    elif item_type == 'goal':
        item = Goal.query.get_or_404(item_id)
        item.name = data['name']
        item.description = data.get('description', '')
        if 'connections' in data:
            values = Value.query.filter(Value.id.in_(data['connections'])).all()
            item.values = values
    elif item_type == 'metric':
        item = Metric.query.get_or_404(item_id)
        item.name = data['name']
        item.description = data.get('description', '')
        if 'connections' in data:
            goals = Goal.query.filter(Goal.id.in_(data['connections'])).all()
            item.goals = goals
    else:
        return jsonify({'error': 'Invalid item type'}), 400
    
    db.session.commit()
    
    print(f"✓ {item_type.upper()} UPDATED: {item.name} (ID: {item_id})")
    
    return jsonify(item.to_dict())

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True) 