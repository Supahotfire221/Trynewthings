#!/usr/bin/env python3
"""
Production entry point for the Face Swap AI backend application.
"""
import os
from app import create_app

app = create_app('production')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)