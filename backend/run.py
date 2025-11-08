#!/usr/bin/env python3
"""
Main entry point for the Face Swap AI backend application.
"""
import os
from app import create_app
from app.models import db

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)