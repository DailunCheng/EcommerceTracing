import time
import numpy as np
import matplotlib.pyplot as plt

from latency_tracking import getLatency

LOOKBACK = 3500
SERVICE_NAME = "frontend"
HOST_IP = "128.253.128.66"
TIME_LIMIT = 5 * 60 # 5 minutes

# times = []
# latencies = []
#
# start_ts = int(time.time())
# curr_ts = int(time.time())
#
# while curr_ts - start_ts < TIME_LIMIT:
#     curr_ts = int(time.time())
#     latency = getLatency(LOOKBACK, SERVICE_NAME, HOST_IP)
#     times.append(curr_ts - start_ts)
#     if latency < 0:
#         latency = 0
#     latencies.append(latency)
#     print(str(curr_ts - start_ts) + " s: " + str(latency) + " ms")
#     time.sleep(1)
#
# times = np.array(times)
# latencies = np.array(latencies)
# # latencies[latencies < 0] = 0
# np.savetxt('times', times)
# np.savetxt('latencies', latencies)
# plt.plot(times, latencies)
# plt.show()



def run_scaling(sensitivity):
    times = []
    latencies = []

    start_ts = int(time.time())
    curr_ts = start_ts

    while curr_ts - start_ts < TIME_LIMIT:
        curr_ts = int(time.time())
        latency = getLatency(LOOKBACK, SERVICE_NAME, HOST_IP)
        if latency > sensitivity:

        times.append(curr_ts - start_ts)
        latencies.append(latency)
        print(str(curr_ts - start_ts) + " s: " + str(latency) + " ms")
        time.sleep(1)

    times = np.array(times)
    latencies = np.array(latencies)
    # latencies[latencies < 0] = 0
    # np.savetxt('times', times)
    # np.savetxt('latencies', latencies)
    plt.plot(times, latencies)
    plt.show()

if __name__ == "__main__":
