# Vercel serverless function entry point
from backend.simple_app import app
from flask import jsonify

# Vercel expects a handler function
def handler(request):
    # Convert Vercel request to Flask request
    with app.test_request_context(
        path=request.path,
        method=request.method,
        headers=dict(request.headers),
        data=request.get_data(),
        query_string=request.query_string.decode()
    ):
        response = app.full_dispatch_request()
        return response