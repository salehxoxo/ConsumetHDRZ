import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import requests
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
from collections import defaultdict
import random
import string
# import redis
from flask_sqlalchemy import SQLAlchemy
import json

app = Flask(__name__)
socketio = SocketIO(app)

# Database setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///room_data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
app.secret_key = '43fe4w553vf'
Moov = 0





import subprocess
import json

def call_node_script(func_name, *args):
    # Construct the command to call the Node.js script with arguments
    command = ['node', 'script.js', func_name] + list(map(str, args))
    
    try:
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )

        # Check for errors
        if result.stderr:
            print("Error:", result.stderr)

        # Process the output
        output = result.stdout.strip()
        if func_name == "getId":
            data = output
        else:
            data = json.loads(output)  # Parse JSON output
            data = data["src"]["720p"].split(" ")[0]
        return data


    except Exception as e:
        print(f"An error occurred: {e}")
        return None


# Example usage of the functions
# call_node_script("getId", "flash", "2014", "Сериал")
# call_node_script("main", 62792, "movie")
# call_node_script("main", 42697, "tv", 2, 15)





# Define the filter
@app.template_filter('join_genres')
def join_genres(genre_list):
    return ','.join(map(str, genre_list))


# Model to store video sources per room
class RoomVideoSource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(10), unique=True, nullable=False)
    video_source = db.Column(db.String(555), nullable=False)

def generate_room_code(length=3):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@app.route('/', methods=['GET', 'POST'])
def login():

    if request.method == 'POST':
        username = request.form['user']
        session['username'] = username  # Store the username in the session
        room_code = generate_room_code()
        session['room_code'] = room_code
        session['Admin'] = 'tf'
        return redirect(url_for('index'))

    return render_template('login.html')


@socketio.on('create_room')
def handle_create_room():
    room_code = session.get('room_code')
    username = session.get('username')
    if (username != 'noroom'):
        join_room(room_code)
        print(f"Room {room_code} created by {session['username']}")


@app.route('/index')
def index():
    username = session.get('username')  # Retrieve the username from the session
    room_code = session.get('room_code')
    return render_template('base.html', username=username,room_code=room_code)


@app.route('/anime', methods=['GET', 'POST'])
def anime_page():

    username = session.get('username')  # Retrieve the username from the session
    room_code = session.get('room_code')

    if request.method == 'POST':
        query = request.form['query']
        api_url = f'https://consume2.vercel.app/anime/gogoanime/{query}'
        response = requests.get(api_url, params={"page": 1}, verify=False)
        results = response.json().get('results', [])
    
        return render_template('search_results.html', results=results, username=username,room_code=room_code)

    api_url = f'https://consume2.vercel.app/anime/gogoanime/top-airing'
    response = requests.get(api_url, verify=False)
    results0 = response.json().get('results', [])

    return render_template('anime.html', results=results0, username=username,room_code=room_code)

@app.route('/movie', methods=['GET', 'POST'])
def movie_page():

    username = session.get('username')  # Retrieve the username from the session
    room_code = session.get('room_code')

    if request.method == 'POST':
        query = request.form['query']
        api_url = 'https://api.themoviedb.org/3/search/multi'
        params = {"query": query, "include_adult": "true","language": "en-US","page": "1"}
        headers = {"accept": "application/json","Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2MzIwNmUyYTVhMDEyZWJkMjExNTJjNjBhNDhiY2ZiNyIsIm5iZiI6MTcyODcxNjE5Mi42MzI0NTUsInN1YiI6IjY3MGExY2JiNDExMWJlNGYwMjc0MGViYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.LbSCsOmp_aiXcIIAzar3qBb_WUJt9Jrb5BTGA3a5044"}

        response = requests.get(api_url, headers=headers, params=params)
        results = response.json()
    
        return render_template('search_results2.html', results=results, username=username,room_code=room_code)

    # api_url = f'https://consume2.vercel.app/anime/gogoanime/top-airing'
    # response = requests.get(api_url, verify=False)
    # results0 = response.json().get('results', [])

    return render_template('movie.html',username=username,room_code=room_code)


import requests

@app.route('/the_room/<anime_id>')
def the_room(anime_id):
    username = session.get('username')
    room_code = session.get('room_code')

    # Fetch episode list from the API
    info_url = f'https://consume2.vercel.app/anime/gogoanime/info/{anime_id}'
    response = requests.get(info_url, verify=False)
    anime_info = response.json()

    episodes = anime_info.get('episodes', [])
    
    # Fetch the sources for the first episode to get available resolutions
    urll = f'https://consume2.vercel.app/anime/gogoanime/watch/{anime_id}-episode-1'
    response = requests.get(urll, verify=False)
    sources = response.json().get('sources', [])
    
    # Store available resolutions
    available_resolutions = {source['quality']: source['url'] for source in sources}

    if available_resolutions.get('720p'):
        Link = available_resolutions.get('720p')
        Res = '720p'
    elif available_resolutions.get('480p'):
        Link = available_resolutions.get('480p')
        Res = '480p'
    elif   available_resolutions.get('360p'):
        Link = available_resolutions.get('360p')
        Res = '360p'

    if Link:
        existing_room = RoomVideoSource.query.filter_by(room_code=room_code).first()
        if existing_room:
            existing_room.video_source = Link
        else:
            new_room = RoomVideoSource(room_code=room_code, video_source=Link)
            db.session.add(new_room)
        db.session.commit()

    room = session.get('room_code')
    socketio.emit('video_src_set', {'videoSrc': Link, 'room_code': room_code}, room=room)

    available_resolutions_json = json.dumps(available_resolutions)
    Moov = 0

    return render_template('Room.html', Moov=Moov, urll=Link, username=username, room_code=room_code, episodes=episodes,  availableResolutions=available_resolutions_json, availableResolutions2=available_resolutions, Res=Res)

@app.route('/the_room')
def the_room2():
    movie_id = request.args.get('movie_id')
    media_type = request.args.get('media_type')
    movie_name = request.args.get('movie_name')
    movie_year = request.args.get('movie_year')
    movie_genres = request.args.get('genres')  
    print(movie_genres)
    # Convert the string to a list of integers
    movie_genres = [int(genre) for genre in movie_genres.split(',')]
    movie_year = movie_year[:4]
    # print(movie_year)
    username = session.get('username')
    room_code = session.get('room_code')
    print(movie_year)
    print(movie_name)
    # data = call_node_script("getId", movie_name, movie_year, "Фильм")
    # call_node_script("main", 62792, "movie")
    # url = f'http://localhost:3000/id/{movie_name}/{movie_year}/Фильм'
    # response = requests.get(url)
    # data = response.json()
    # movie_id2 = data.get("id", [None])[0]
    # movie_id2 = str(data)[1:-1].replace("'", "").replace('"', "").replace(" ", "")
    # movie_id2 = movie_id2.split(',')[0]
    # print(movie_id2)
    # print(data)
    print("HELLLLLLLOOOOOOOOOO")
    print(media_type)
    if (media_type == 'movie'):
        target = 16
        print(movie_genres)

        if target in movie_genres:
            print("animation")
            data = call_node_script("getId", movie_name, movie_year, "Мультфильм")
        else:
            print("movie")
            data = call_node_script("getId", movie_name, movie_year, "Фильм") 
        # data = call_node_script("getId", movie_name, movie_year, "Мультфильм")
        movie_id2 = str(data)[1:-1].replace("'", "").replace('"', "").replace(" ", "")
        movie_id2 = movie_id2.split(',')[0]
        print(data)
        print(movie_id2)

        print("HELLLLLLLOOOOOOOOOO")
        # url = f'http://localhost:3000/vidlink/watch?id={movie_id}&isMovie=true'
        Link = call_node_script("main", movie_id2, "movie")
        # url = f'http://localhost:3000/stream/{movie_id2}/movie'
        # response = requests.get(url)
        # data = response.json()
        # print(data)
        # Link = data['stream']['playlist']
        # print(data)
        # Link = data["src"]["480p"]
        # Link = Link.split(" ")[0] 
        print(f"\n\nThe link {Link}\n\n")
        seasons = None
        mov_id = movie_id2

    elif (media_type == 'tv'):

        data = call_node_script("getId", movie_name, movie_year, "Сериал")
        movie_id2 = str(data)[1:-1].replace("'", "").replace('"', "").replace(" ", "")
        movie_id2 = movie_id2.split(',')[0]
        print(movie_id2)

        # Link = call_node_script("main", movie_id2, "tv", 1, 1)

        url = f"https://api.themoviedb.org/3/tv/{movie_id}?language=en-US"
        headers = {"accept": "application/json","Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2MzIwNmUyYTVhMDEyZWJkMjExNTJjNjBhNDhiY2ZiNyIsIm5iZiI6MTcyODcxNjE5Mi42MzI0NTUsInN1YiI6IjY3MGExY2JiNDExMWJlNGYwMjc0MGViYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.LbSCsOmp_aiXcIIAzar3qBb_WUJt9Jrb5BTGA3a5044"}
        response = requests.get(url, headers=headers)
        data = response.json()
        seasons = data.get('seasons', [])
        Link = None
        mov_id = movie_id2

    if Link:
        existing_room = RoomVideoSource.query.filter_by(room_code=room_code).first()
        if existing_room:
            existing_room.video_source = Link
        else:
            new_room = RoomVideoSource(room_code=room_code, video_source=Link)
            db.session.add(new_room)
        db.session.commit()
        
        room = session.get('room_code')
        socketio.emit('video_src_set', {'videoSrc': Link, 'room_code': room_code}, room=room)

    Moov = 1

    return render_template('Room.html',mov_id=mov_id, seasons=seasons, Moov=Moov, urll=Link, username=username, room_code=room_code)


@app.route('/main', methods=['GET'])
def main():
    id = request.args.get('id')
    type = request.args.get('type')
    season = request.args.get('season')
    episode = request.args.get('episode')
    result = call_node_script("main", id, type, season, episode)
    print(result)
    return jsonify(result)


@socketio.on('sync_room_event')
def sync_room_eve():

    print(f"Test")
    if (session['Admin'] != 'tf'):
        room_code = session['Admin']
        print(room_code)

        room_data = RoomVideoSource.query.filter_by(room_code=room_code).first()

        emit('video_src_set', {'videoSrc': room_data.video_source}, broadcast=True)

    

@app.route('/join', methods=['GET', 'POST'])
def join_roomm():
    username = session.get('username')  # Retrieve the username from the session
    room_code = session.get('room_code')
    if request.method == 'POST':
        query = request.form['query']
        session['Admin'] = query
        return  redirect(url_for('room2', room_code=query))

    return render_template('join.html', username=username,room_code=room_code)


@socketio.on('join_room_event')
def handle_join_room(data):
    room = data['room']
    username = session.get('username')
    join_room(room)
    
    # Count the number of users in the room
    room_members = socketio.server.manager.rooms['/'].get(room, [])
    number_of_users = len(room_members)

    emit('message', {'user': 'System', 'message': f'{username} has joined the room. ({number_of_users} users in the room)'}, to=room)
    # print(f"{username} joined room {room}, total users: {number_of_users}")


@socketio.on('send_message')
def handle_send_message(data):
    room = data['room']
    message = data['message']
    username = session.get('username')
    emit('message', {'user': username, 'message': message}, room=room)



@app.route('/room2')
def room2():

    room_code = request.args.get('room_code')  # Get room_code from query params
    print(room_code)

    # Retrieve video source from SQLite
    room_data = RoomVideoSource.query.filter_by(room_code=room_code).first()
    link = room_data.video_source if room_data else None

    print(link)
    # link = room_video_sources[data['room_code']]

    return render_template('room2.html', urll=link, room_code=room_code)

@socketio.on('play_pause_stop')
def handle_play_pause_stop(data):
    # print(f"Action: {data['action']} by {data['username']} in room {data['room_code']}")
    print("wtf2")
    emit('play_pause_stop', data, room=data['room_code'])


@socketio.on('sync_request')
def handle_sync_request(data):
    room_code = data['room_code']
    emit('sync_update', { 'currentTime': data['currentTime'], 'isPlaying': data['isPlaying'] }, room=room_code)    




# @socketio.on('switch_episode')
# def switch_ep(data):
#     room33 = data['room_code']
#     ep = data['episode_id']
#     Res = data['res_current']
#     print(Res)
#     print('nig balls2')
#     emit('switch_episode', {'episode_id': ep, 'room_code': room33, 'res_current': Res}, room=room33)

@socketio.on('epi_set')
def epi_set(data):
    print("Updating video source in database")
    
    # Extract data from the emitted event
    urlll = data.get('urlll')
    room_code = data.get('room_code')
    
    if urlll and room_code:
        # Update or create the video source in the database
        existing_room = RoomVideoSource.query.filter_by(room_code=room_code).first()
        if existing_room:
            existing_room.video_source = urlll  # Update existing source
        db.session.commit()  # Commit changes to the database
    
        # Emit updated video source to all clients in the room
        socketio.emit('video_src_set', {'videoSrc': urlll, 'room_code': room_code}, room=room_code)
        print(f"Updated video source to: {urlll} for room code: {room_code}")
    else:
        print("Error: 'urlll' or 'room_code' is missing")


@socketio.on('seek_event')
def handle_seek_event(data):
    room = data['room_code']
    current_time = data['currentTime']
    
    # Broadcast the seeking event to all users in the room except the sender
    emit('seek_update', {
        'currentTime': current_time
    }, room=room, broadcast=True, include_self=False)


if __name__ == '__main__':
    # Ensure the database is created within the application context
    with app.app_context():
        db.create_all()  # Create the SQLite tables if they don't exist
    socketio.run(app, debug=True)