from matplotlib import pyplot as plt
import seaborn as sns
from io import BytesIO
import typing
from datetime import datetime, timedelta
import matplotlib.dates as mdates
import time

sns.set_theme()


def get_stats(mongo) -> str:
    total_users = mongo.users.count_documents({})
    new_users_today = mongo.users.count_documents(
        {'start_timestamp': {'$gt': int(time.time() - 24 * 3600)}}
    )
    new_users_week = mongo.users.count_documents(
        {'start_timestamp': {'$gt': int(time.time() - 24 * 3600 * 7)}}
    )

    total_packs = mongo.sticker_packs.count_documents({})
    new_packs_today = mongo.sticker_packs.count_documents(
        {'timestamp': {'$gt': int(time.time() - 24 * 3600)}}
    )
    packs_by_status = dict()
    packs_by_status_today = dict()
    for status in ['queued', 'processing', 'retrying1', 'retrying2', 'generated', 'created', 'failed']:
        packs_by_status[status] = mongo.sticker_packs.count_documents({'status': status})
        packs_by_status_today[status] = mongo.sticker_packs.count_documents({
            'status': status,
            'timestamp': {'$gt': int(time.time() - 24 * 3600)}
        })
    # stages_timestamps difference between processing and generated
    average_processing_time_today = mongo.sticker_packs.aggregate([
        {'$match': {
            'stages_timestamps.processing': {'$exists': True},
            'stages_timestamps.generated': {'$exists': True},
            'timestamp': {'$gt': int(time.time() - 24 * 3600)}
        }},
        {'$project': {
            'processing_time': {'$subtract': ['$stages_timestamps.generated', '$stages_timestamps.processing']}
        }},
        {'$group': {
            '_id': None,
            'average_processing_time': {'$avg': '$processing_time'}
        }}
    ])
    return f'''Total users: {total_users}
New users today: {new_users_today}
New users this week: {new_users_week}
Total packs: {total_packs}
New packs today: {new_packs_today}
Packs by status: {packs_by_status}
Packs by status today: {packs_by_status_today}
Average processing time today: {list(average_processing_time_today)}'''


def get_charts(mongo) -> typing.List[bytes]:
    charts = list()
    uvt_time, uvt_users = list(), list()
    for user in mongo.users.find({}):
        if not user.get('start_timestamp'):
            continue
        timestamp = user['start_timestamp']
        if len(uvt_time) and timestamp - uvt_time[-1] < 300:
            uvt_users[-1] += 1
        else:
            if len(uvt_users):
                uvt_users.append(uvt_users[-1] + 1)
                uvt_time.append(timestamp)
            else:
                uvt_time, uvt_users = [timestamp], [1]
    uvt_fig, uvt_ax = plt.subplots(nrows=1, ncols=1)
    uvt_time = [datetime.fromtimestamp(t) for t in uvt_time]
    uvt_ax.set_title('Users vs. time')
    uvt_ax.set_xlabel('Time')
    uvt_ax.set_ylabel('Users')
    uvt_ax.plot(uvt_time, uvt_users, label='Total Users')
    uvt_ax.fill_between(uvt_time, uvt_users, [0] * len(uvt_time), alpha=0.5)
    uvt_ax.legend()
    uvt_ax.xaxis.set_ticks(mdates.drange(uvt_time[0], uvt_time[-1], (uvt_time[-1] - uvt_time[0]) / 5))
    uvt_bytes = BytesIO()
    uvt_bytes.mime_type = 'image/png'
    uvt_bytes.name = 'chart.png'
    uvt_fig.savefig(uvt_bytes)
    plt.close(uvt_fig)
    charts.append(uvt_bytes.getvalue())
    uvt_fig, uvt_ax = plt.subplots(nrows=1, ncols=1)
    uvt_time = [dt for dt in uvt_time if dt >= datetime.now() - timedelta(days=5)]
    uvt_ax.set_title('@literalmebot Users vs. time: last 5 days')
    uvt_ax.set_ylabel('Users')
    uvt_ax.set_xlabel('Time')
    uvt_users = uvt_users[-len(uvt_time):]
    uvt_ax.plot(uvt_time, uvt_users, label='Total users')
    uvt_ax.fill_between(uvt_time, uvt_users, [0] * len(uvt_time), alpha=0.5)
    uvt_ax.legend()
    uvt_bytes = BytesIO()
    uvt_bytes.mime_type = 'image/png'
    uvt_bytes.name = 'chart.png'
    uvt_bytes.filename = 'chart.png'
    uvt_ax.xaxis.set_ticks(mdates.drange(uvt_time[0], uvt_time[-1], (uvt_time[-1] - uvt_time[0]) / 5))
    uvt_fig.savefig(uvt_bytes)
    plt.close(uvt_fig)
    charts.append(uvt_bytes.getvalue())
    # Packs vs. time (last 5 days)
    pvt_time, pvt_packs = list(), list()
    for pack in mongo.sticker_packs.find({}):
        if not pack.get('timestamp'):
            continue
        timestamp = pack['timestamp']
        if len(pvt_time) and timestamp - pvt_time[-1] < 300:
            pvt_packs[-1] += 1
        else:
            if len(pvt_packs):
                pvt_packs.append(pvt_packs[-1] + 1)
                pvt_time.append(timestamp)
            else:
                pvt_time, pvt_packs = [timestamp], [1]
    pvt_fig, pvt_ax = plt.subplots(nrows=1, ncols=1)
    pvt_time = [dt for dt in pvt_time if datetime.fromtimestamp(dt) >= datetime.now() - timedelta(days=5)]
    pvt_ax.set_title('@literalmebot: Packs vs. time')
    pvt_ax.set_ylabel('Packs')
    pvt_ax.set_xlabel('Time')
    pvt_packs = pvt_packs[-len(pvt_time):]
    pvt_ax.plot(pvt_time, pvt_packs, label='Total packs')
    pvt_ax.fill_between(pvt_time, pvt_packs, [0] * len(pvt_time), alpha=0.5)
    pvt_ax.legend()
    pvt_bytes = BytesIO()
    pvt_bytes.mime_type = 'image/png'
    pvt_bytes.name = 'chart-packs.png'
    pvt_bytes.filename = 'chart-packs.png'
    pvt_ax.xaxis.set_ticks(mdates.drange(datetime.fromtimestamp(pvt_time[0]), datetime.fromtimestamp(pvt_time[-1]),
                                         (datetime.fromtimestamp(pvt_time[-1]) - datetime.fromtimestamp(pvt_time[0]))
                                         / 5))
    pvt_fig.savefig(pvt_bytes)
    plt.close(pvt_fig)
    charts.append(pvt_bytes.getvalue())
    return charts
