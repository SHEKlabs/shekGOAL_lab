# shekGOAL_Lab

A web application for managing personal values, goals, and metrics in a hierarchical structure. Built with Flask, SQLite, and D3.js.

## Features

- Create and manage values, goals, and metrics
- Visualize relationships between values, goals, and metrics using D3.js
- Interactive visualization with click-to-edit functionality
- Responsive design using Bootstrap
- RESTful API endpoints for data management

## Tech Stack

- Backend: Flask (Python)
- Database: SQLite
- Frontend: HTML, CSS (Bootstrap), JavaScript
- Visualization: D3.js

## Setup

1. Clone the repository:
```bash
git clone https://github.com/SHEKlabs/shekGOAL_lab.git
cd shekGOAL_lab
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install flask flask-sqlalchemy
```

4. Run the application:
```bash
python app.py
```

5. Open your browser and navigate to `http://127.0.0.1:5000`

## Usage

1. Add Values: Enter a value name and click "Add Value"
2. Add Goals: Enter a goal name, description, and select associated values
3. Add Metrics: Enter a metric name and select associated goals
4. View the visualization: The hierarchical structure will be displayed automatically
5. Edit/Delete: Click on any box in the visualization to edit or delete items

## API Endpoints

- `GET /api/hierarchy`: Get all values, goals, and metrics
- `POST /api/value`: Create a new value
- `POST /api/goal`: Create a new goal
- `POST /api/metric`: Create a new metric
- `PUT /api/connections`: Update relationships between items
- `DELETE /api/<item_type>/<id>`: Delete an item
- `POST /api/reset`: Reset all data

## License

MIT License
