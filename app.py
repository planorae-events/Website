from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import datetime
import jwt
import bcrypt
import random
import re
import certifi
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from flask_mail import Mail, Message

load_dotenv()
from functools import wraps

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "https://planorae12.vercel.app"]}}) # Replace with your actual Vercel URL later

# Configuration
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'fallback_secret')
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

mail = Mail(app)

# MongoDB setup
try:
    client = MongoClient(os.getenv('MONGO_URI'), 
                         tls=True,
                         tlsAllowInvalidCertificates=True,
                         serverSelectionTimeoutMS=5000)
    # Trigger a connection test
    client.admin.command('ping')
    db = client.planorae
    print("MongoDB connection successful!")
except Exception as e:
    print(f"MongoDB connection error: {e}")
    # Provide a dummy db or better error reporting if needed
    db = None

# --- Auth Middleware ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            # Handle Bearer token
            if " " in auth_header:
                token = auth_header.split(" ")[1]
            else:
                token = auth_header
                
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = db.users.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except Exception as e:
            print(f"Token error: {e}")
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# --- Helpers ---
def send_email(subject, recipient, body):
    try:
        if app.config['MAIL_USERNAME']:
            msg = Message(subject, sender=app.config['MAIL_USERNAME'], recipients=[recipient])
            msg.body = body
            mail.send(msg)
            return True
        else:
            print(f"Email simulation to {recipient}: {subject}\n{body}")
            return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def validate_email(email):
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_regex, email) is not None

def validate_password(password):
    if len(password) < 8: return False
    if not re.search("[a-z]", password): return False
    if not re.search("[A-Z]", password): return False
    if not re.search("[0-9]", password): return False
    if not re.search("[_@$!%*#?&]", password): return False
    return True

# --- Routes ---

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    if db is None:
        return jsonify({'message': 'Internal server error: Database connection is not established.'}), 500
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        username = data.get('username')

        if not email or not validate_email(email):
            return jsonify({'message': 'Invalid email address!'}), 400

        if not validate_password(password):
            return jsonify({'message': 'Password does not meet requirements!'}), 400

        if db.users.find_one({'email': email}):
            return jsonify({'message': 'User already exists!'}), 400

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user_id = db.users.insert_one({
            'username': username,
            'email': email,
            'password': hashed_password,
            'verified': False,
            'failed_attempts': 0,
            'locked_until': None
        }).inserted_id

        # Send OTP
        otp = str(random.randint(100000, 999999))
        db.otps.insert_one({
            'email': email,
            'otp': otp,
            'expires_at': datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
        })
        
        send_email("Planorae - Verify your email", email, f"Your OTP for signup is: {otp}")
        
        return jsonify({'message': 'Signup successful! Please verify your email.', 'user_id': str(user_id)}), 201
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({'message': f'Internal server error: {str(e)}'}), 500

@app.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    if db is None:
        return jsonify({'message': 'Internal server error: Database connection is not established.'}), 500
    data = request.json
    email = data.get('email')
    otp = data.get('otp')

    record = db.otps.find_one({'email': email, 'otp': otp})
    if not record or record['expires_at'] < datetime.datetime.utcnow():
        return jsonify({'message': 'Invalid or expired OTP!'}), 400

    db.users.update_one({'email': email}, {'$set': {'verified': True}})
    db.otps.delete_many({'email': email})

    return jsonify({'message': 'Email verified successfully!'})

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    if db is None:
        return jsonify({'message': 'Internal server error: Database connection is not established.'}), 500
    token = request.json.get('token')
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), os.getenv('GOOGLE_CLIENT_ID'))
        
        email = idinfo['email']
        username = idinfo.get('name', email.split('@')[0])
        
        user = db.users.find_one({'email': email})
        if not user:
            user_id = db.users.insert_one({
                'username': username,
                'email': email,
                'verified': True,
                'google_user': True
            }).inserted_id
        else:
            user_id = user['_id']
            
        token = jwt.encode({
            'user_id': str(user_id),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({'token': token, 'username': username}), 200
    except ValueError:
        return jsonify({'message': 'Invalid Google token!'}), 400
    except Exception as e:
        print(f"Google auth error: {e}")
        return jsonify({'message': 'Internal server error!'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    if db is None:
        return jsonify({'message': 'Internal server error: Database connection is not established.'}), 500
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not validate_email(email):
        return jsonify({'message': 'Invalid email address!'}), 400

    user = db.users.find_one({'email': email})
    if not user:
        return jsonify({'message': 'Invalid credentials!'}), 401

    # Check lock
    if user.get('locked_until') and user['locked_until'] > datetime.datetime.utcnow():
        return jsonify({'message': 'Account is locked. Try again later.'}), 403

    if bcrypt.checkpw(password.encode('utf-8'), user['password']):
        # Reset failed attempts
        db.users.update_one({'_id': user['_id']}, {'$set': {'failed_attempts': 0, 'locked_until': None}})
        
        token = jwt.encode({
            'user_id': str(user['_id']),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({'token': token, 'username': user['username']})
    else:
        # Increment failed attempts
        new_attempts = user.get('failed_attempts', 0) + 1
        lock_until = None
        if new_attempts >= 5:
            lock_until = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
        
        db.users.update_one({'_id': user['_id']}, {
            '$set': {'failed_attempts': new_attempts, 'locked_until': lock_until}
        })
        
        return jsonify({'message': 'Invalid credentials!'}), 401

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    if db is None:
        return jsonify({'message': 'Internal server error: Database connection is not established.'}), 500
    email = request.json.get('email')
    if not email or not validate_email(email):
        return jsonify({'message': 'Invalid email address!'}), 400
        
    user = db.users.find_one({'email': email})
    if not user:
        return jsonify({'message': 'User not found!'}), 404
    
    otp = str(random.randint(100000, 999999))
    db.otps.insert_one({
        'email': email,
        'otp': otp,
        'expires_at': datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    })
    
    send_email("Planorae - Password Reset", email, f"Your OTP for password reset is: {otp}")
    
    return jsonify({'message': 'Reset OTP sent to your email.'}), 200

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    if db is None:
        return jsonify({'message': 'Internal server error: Database connection is not established.'}), 500
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('password')
    
    if not validate_password(new_password):
        return jsonify({'message': 'Password does not meet requirements!'}), 400
        
    otp_record = db.otps.find_one({
        'email': email,
        'otp': otp,
        'expires_at': {'$gt': datetime.datetime.utcnow()}
    })
    
    if not otp_record:
        return jsonify({'message': 'Invalid or expired OTP!'}), 400
        
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    db.users.update_one({'email': email}, {'$set': {'password': hashed_password}})
    db.otps.delete_one({'_id': otp_record['_id']})
    
    return jsonify({'message': 'Password reset successful!'}), 200

# --- Smart Grouping (Ported to Mongo) ---

def calculate_similarity(user_profile, other_profiles):
    interest_map = {'nightlife': 0, 'trekking': 1, 'beaches': 2, 'adventure': 3, 'culture': 4}
    travel_style_map = {'luxury': 0, 'backpacking': 1, 'chill': 2, 'party': 3}
    gender_map = {'male': 0, 'female': 1, 'other': 2}
    preference_map = {'yes': 0, 'no': 1, 'occasionally': 2}
    
    def vectorize(p):
        # Interests (5) + Travel Style (4) + Hobbies (1) + Gender (3) + Drinking (3) + Smoking (3) + Budget (1) = 20 dimensions
        vec = np.zeros(20) 
        
        # Interests
        if p.get('interests'):
            for interest in p['interests'].split(','):
                i = interest.strip().lower()
                if i in interest_map: vec[interest_map[i]] = 1
        
        # Travel Style
        if p.get('travel_style'):
            s = p['travel_style'].strip().lower()
            if s in travel_style_map: vec[5 + travel_style_map[s]] = 1
            
        # Hobbies (simple presence for now)
        if p.get('hobbies'):
            vec[9] = 1
            
        # Gender
        if p.get('gender'):
            g = p['gender'].strip().lower()
            if g in gender_map: vec[10 + gender_map[g]] = 1
            
        # Drinking Preference
        if p.get('drinking_preference'):
            d = p['drinking_preference'].strip().lower()
            if d in preference_map: vec[13 + preference_map[d]] = 1
            
        # Smoking Preference
        if p.get('smoking_preference'):
            sm = p['smoking_preference'].strip().lower()
            if sm in preference_map: vec[16 + preference_map[sm]] = 1

        # Budget (simple presence for now, could be range later)
        if p.get('budget_range'):
            vec[19] = 1
            
        return vec

    user_vec = vectorize(user_profile).reshape(1, -1)
    other_vecs = np.array([vectorize(p) for p in other_profiles])
    if len(other_vecs) == 0: return []
    return cosine_similarity(user_vec, other_vecs)[0]

@app.route('/api/profile', methods=['POST'])
@token_required
def update_profile(current_user):
    if db is None:
        return jsonify({'message': 'Internal server error: Database connection is not established.'}), 500
    data = request.json
    
    # Extract new profile fields
    interests = data.get('interests')
    travel_style = data.get('travel_style')
    budget_range = data.get('budget_range')
    hobbies = data.get('hobbies')
    gender = data.get('gender')
    drinking_preference = data.get('drinking_preference')
    smoking_preference = data.get('smoking_preference')

    profile_data = {
        'interests': interests,
        'travel_style': travel_style,
        'budget_range': budget_range,
        'hobbies': hobbies,
        'gender': gender,
        'drinking_preference': drinking_preference,
        'smoking_preference': smoking_preference,
        'is_complete': True # Assume complete if all fields are provided via this endpoint
    }

    # Check for missing required fields to set is_complete status
    required_fields = ['interests', 'travel_style', 'budget_range', 'hobbies', 'gender', 'drinking_preference', 'smoking_preference']
    for field in required_fields:
        if not profile_data.get(field):
            profile_data['is_complete'] = False
            break

    db.users.update_one({'_id': current_user['_id']}, {'$set': {'profile': profile_data}})
    return jsonify({'message': 'Profile updated!'})

@app.route('/api/profile/status', methods=['GET'])
@token_required
def get_profile_status(current_user):
    if db is None:
        return jsonify({'message': 'Internal server error: Database connection is not established.'}), 500

    profile = current_user.get('profile', {})
    is_complete = profile.get('is_complete', False)

    required_fields = ['interests', 'travel_style', 'budget_range', 'hobbies', 'gender', 'drinking_preference', 'smoking_preference']

    missing_fields = []
    for field in required_fields:
        if not profile.get(field):
            missing_fields.append(field)

    if missing_fields:
        is_complete = False
    else:
        is_complete = True

    if profile.get('is_complete') != is_complete:
        db.users.update_one({'_id': current_user['_id']}, {'$set': {'profile.is_complete': is_complete}})

    return jsonify({'is_complete': is_complete, 'missing_fields': missing_fields}), 200

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    if db is None:
        return jsonify({'message': 'Internal server error: Database connection is not established.'}), 500

    profile = current_user.get('profile', {})

    return jsonify({
        'interests': profile.get('interests') or '',
        'travel_style': profile.get('travel_style') or '',
        'budget_range': profile.get('budget_range') or '',
        'hobbies': profile.get('hobbies') or '',
        'gender': profile.get('gender') or '',
        'drinking_preference': profile.get('drinking_preference') or '',
        'smoking_preference': profile.get('smoking_preference') or ''
    }), 200

@app.route('/api/groups/assign', methods=['POST'])
@token_required
def assign_group(current_user):
    if db is None:
        return jsonify({'message': 'Internal server error: Database connection is not established.'}), 500

    user_profile = current_user.get('profile')
    if not user_profile or not user_profile.get('is_complete'):
        return jsonify({'message': 'Profile not complete. Cannot assign to a group.'}), 400

    # Find existing groups with space
    eligible_groups = list(db.groups.find({
        'is_private': False,
        '$expr': {'$lt': [{'$size': '$members'}, 15]}
    }))

    best_group = None
    max_similarity = -1

    # Try to find a compatible existing group
    for group in eligible_groups:
        group_members_ids = [ObjectId(member_id) for member_id in group['members']]
        group_members = list(db.users.find({'_id': {'$in': group_members_ids}}))
        
        other_profiles = [member.get('profile') for member in group_members if member.get('profile')]
        
        if other_profiles:
            similarities = calculate_similarity(user_profile, other_profiles)
            avg_similarity = sum(similarities) / len(similarities)
            
            if avg_similarity > max_similarity:
                max_similarity = avg_similarity
                best_group = group

    if best_group and max_similarity > 0.5: # Threshold for compatibility
        db.groups.update_one(
            {'_id': best_group['_id']},
            {'$push': {'members': str(current_user['_id'])}}
        )
        return jsonify({'message': f'Assigned to existing group {best_group["_id"]}', 'group_id': str(best_group["_id"])}), 200
    else:
        # Create a new group if no suitable existing group is found
        new_group_id = db.groups.insert_one({
            'destination': user_profile.get('travel_style', 'flexible'), # Use travel style as a proxy for destination for new groups
            'is_private': False,
            'members': [str(current_user['_id'])],
            'created_by': str(current_user['_id']),
            'created_at': datetime.datetime.utcnow()
        }).inserted_id
        return jsonify({'message': f'Created new group {new_group_id}', 'group_id': str(new_group_id)}), 201

@app.route('/api/groups/auto-join', methods=['POST'])
@token_required
def auto_join(current_user):
    if db is None:
        return jsonify({'message': 'Internal server error: Database connection is not established.'}), 500
    data = request.json
    destination = data.get('destination')
    
    # Simple logic: Find groups for destination with space
    group = db.groups.find_one({'destination': destination, 'is_private': False, '$expr': {'$lt': [{'$size': '$members'}, 15]}})
    
    if not group:
        group_id = db.groups.insert_one({
            'destination': destination,
            'is_private': False,
            'members': [str(current_user['_id'])]
        }).inserted_id
    else:
        db.groups.update_one({'_id': group['_id']}, {'$push': {'members': str(current_user['_id'])}})
        group_id = group['_id']

    return jsonify({'message': f'Joined group for {destination}', 'group_id': str(group_id)})

@app.route('/api/groups/create', methods=['POST'])
@token_required
def create_group(current_user):
    if db is None:
        return jsonify({'message': 'Internal server error: Database connection is not established.'}), 500
    data = request.json
    destination = data.get('destination')
    is_private = data.get('is_private', False)
    
    group_id = db.groups.insert_one({
        'destination': destination,
        'is_private': is_private,
        'members': [str(current_user['_id'])],
        'created_by': str(current_user['_id']),
        'created_at': datetime.datetime.utcnow()
    }).inserted_id

    return jsonify({'message': f'Group created for {destination}', 'group_id': str(group_id)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
