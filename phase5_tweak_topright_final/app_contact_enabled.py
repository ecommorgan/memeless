from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3, os, traceback

REFERRAL_BONUS = 121
DB_FILE = "users.db"

app = Flask(__name__)
app.secret_key = "my_super_secret_key_12345"

def init_db(reset=False):
    if reset and os.path.exists(DB_FILE):
        os.remove(DB_FILE)
    if not os.path.exists(DB_FILE):
        with sqlite3.connect(DB_FILE) as conn:
            c = conn.cursor()
            c.execute("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                referral_code TEXT UNIQUE,
                referrer_code TEXT,
                referral_earnings INTEGER DEFAULT 0,
                referral_count INTEGER DEFAULT 0
            )
            """)
            conn.commit()

def get_user_by_wallet(wallet):
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE wallet_address = ?", (wallet,))
        return c.fetchone()

def create_user(wallet, password_hash=None, referrer_code=None):
    referral_code = (wallet[-8:]).upper()
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute("INSERT INTO users (wallet_address, password_hash, referral_code, referrer_code) VALUES (?, ?, ?, ?)",
                  (wallet, password_hash, referral_code, referrer_code))
        conn.commit()
    return referral_code

def credit_referrer(ref_code):
    if not ref_code:
        return False
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute("UPDATE users SET referral_count = referral_count + 1, referral_earnings = referral_earnings + ? WHERE referral_code = ?",
                  (REFERRAL_BONUS, ref_code))
        conn.commit()
        return True

init_db(reset=True)

@app.route('/')
def home():
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    print("REGISTER POST DATA:", dict(request.form))  # For debugging
    try:
        if request.method == 'GET':
            ref = request.args.get('ref', '') or ''
            return render_template('register.html', ref=ref)

        wallet = (request.form.get('wallet_address') or '').strip()
        password = (request.form.get('password') or '').strip()
        confirm = (request.form.get('confirm_password') or '').strip()
        ref = (request.form.get('referred_by') or request.args.get('ref') or '').strip() or None

        if not wallet or not password or not confirm:
            return jsonify({'status': 'error', 'message': 'All fields required'}), 400
        if password != confirm:
            return jsonify({'status': 'error', 'message': 'Passwords do not match'}), 400
        if len(password) < 8:
            return jsonify({'status': 'error', 'message': 'Password must be at least 8 characters'}), 400

        existing = get_user_by_wallet(wallet)
        if existing:
            return jsonify({
                'status': 'error',
                'message': '🚫 This wallet is already registered. Please log in instead.'
            }), 400

            try:
                if existing[2] and check_password_hash(existing[2], password):
                    session['wallet_address'] = wallet
                    return jsonify({'status': 'ok', 'message': 'Welcome back!', 'redirect': url_for('dashboard')})
            except Exception:
                pass
            return jsonify({'status': 'ok', 'message': 'Wallet already registered. Please log in.', 'redirect': url_for('login')})

        pw_hash = generate_password_hash(password)
        create_user(wallet, pw_hash, ref)
        if ref:
            credit_referrer(ref)

        session['wallet_address'] = wallet
        return jsonify({'status': 'ok', 'redirect': url_for('dashboard')})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/login', methods=['POST'])
def login():
    try:
        wallet = (request.form.get('wallet_address') or '').strip()
        password = (request.form.get('password') or '').strip()
        if not wallet or not password:
            return jsonify({'status': 'error', 'message': 'All fields required'}), 400
        user = get_user_by_wallet(wallet)
        if not user or not user[2]:
            return jsonify({'status': 'error', 'message': 'Wallet not registered or no password'}), 401
        if not check_password_hash(user[2], password):
            return jsonify({'status': 'error', 'message': 'Incorrect password'}), 401
        session['wallet_address'] = wallet
        return jsonify({'status': 'ok', 'redirect': url_for('dashboard')})
    except Exception:
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': 'Server error'}), 500


@app.route('/wallet-login', methods=['POST'])
def wallet_login():
    try:
        data = request.get_json() or {}
        wallet = (data.get('wallet_address') or '').strip()
        ref = (data.get('ref') or request.args.get('ref') or '').strip() or None
        if not wallet:
            return jsonify({'status': 'error', 'message': 'Wallet required'}), 400
        user = get_user_by_wallet(wallet)
        if not user:
            create_user(wallet, None, ref)
            if ref:
                credit_referrer(ref)
        session['wallet_address'] = wallet
        return jsonify({'status': 'ok', 'redirect': url_for('dashboard')})
    except Exception:
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': 'Server error'}), 500


@app.route('/dashboard')
def dashboard():
    wallet = session.get('wallet_address')
    if not wallet:
        return redirect(url_for('home'))
    user = get_user_by_wallet(wallet)
    if not user:
        return redirect(url_for('home'))
    referral_code = user[3] or ''
    earnings = user[5] or 0
    count = user[6] or 0
    referral_link = url_for('register', _external=True) + f"?ref={referral_code}"
    return render_template('dashboard.html',
                           wallet_address=wallet,
                           referral_link=referral_link,
                           referral_earnings=earnings,
                           referral_count=count,
                           referral_bonus=REFERRAL_BONUS)


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))


@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/terms')
def terms():
    return render_template('terms.html')

@app.route('/cookies')
def cookies():
    return render_template('cookies.html')

@app.route('/faq')
def faq():
    return render_template('faq.html')

@app.route('/testimonials')
def testimonials():
    return render_template('testimonials.html')

if __name__ == '__main__':
    app.run(debug=True)



@app.route('/auto_login', methods=['POST'])
def auto_login():
    try:
        # Accept JSON or form
        wallet = request.json.get('wallet_address') if request.is_json else request.form.get('wallet_address')
        if not wallet:
            return jsonify({'status': 'error', 'message': 'wallet_address required'}), 400

        wallet_norm = wallet.strip()
        
        import sqlite3
        con = sqlite3.connect(DB_FILE)
        cur = con.cursor()
        cur.execute("""CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet TEXT UNIQUE,
            password TEXT,
            ref_code TEXT,
            balance REAL DEFAULT 0,
            ref_count INTEGER DEFAULT 0
        )""")
        cur.execute("SELECT id FROM users WHERE wallet = ?", (wallet_norm,))
        row = cur.fetchone()
        if not row:
            import secrets, string
            code = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
            cur.execute("INSERT INTO users (wallet, password, ref_code, balance, ref_count) VALUES (?, ?, ?, 0, 0)",
                        (wallet_norm, '', code))
            con.commit()
        con.close()
    

        session['wallet_address'] = wallet_norm
        session['logged_in'] = True

        return jsonify({'status': 'ok', 'redirect': url_for('dashboard')})
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

