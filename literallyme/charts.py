from matplotlib import pyplot as plt
import seaborn as sns
from io import BytesIO
import typing
from datetime import datetime, timedelta
import matplotlib.dates as mdates

sns.set_theme()


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
    uvt_ax.set_title('Users vs. time: last 5 days')
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
    return charts
