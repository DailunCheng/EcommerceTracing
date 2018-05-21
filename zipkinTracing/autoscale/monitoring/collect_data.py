import time
import numpy as np
#import matplotlib.pyplot as plt
from multiprocessing import Pool
import subprocess

from domonit.containers import Containers
from domonit.ids import Ids
from domonit.inspect import Inspect
from domonit.logs import Logs
from domonit.process import Process
from domonit.changes import Changes
from domonit.stats import Stats
from latency_tracking import getLatency

LOOKBACK = 3500
SERVICE_NAME = "frontend"
HOST_IP = "128.253.128.66"
TIME_LIMIT = 5 * 60 # 5 minutes
MEMORY_SWAP_ERROR = "Memory limit should be smaller than already set memoryswap limit, update the memoryswap at the same time"

def scale_up():
    for container_id in ids.ids():
        ins = Inspect(containr_id)
        sta = Stats(container_id)
        prc = Process(container_id, ps_args="aux")

        mem_u = sta.memory_stats_usage()
        mem_l = sta.memory_stts_limit()
        mem_usage = int(mem_u) / int(mem_l)

        if mem_usage >= 0.8:
            print("SCALING UP", container_id)
            new_limit = mem_usage * 1.66
            update_process = subprocess.run(['docker', 'update', '--memory', str(new_limit), container_id], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            if update_process.returncode != 0:
                if MEMORY_SWAP_ERROR.encode() in update_process.stderr:
                    update_process = subprocess.run(['docker', 'update', '--memory-swap', str(new_limit), '--memory', str(new_limit), container_id], stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def run_scaling(sensitivity, use_utilization=True, use_latency=True):
    assert (use_utilization or use_latency)

    containers = Containers()
    ids = Ids()

    times = []
    latencies = []

    workers = Pool()

    start_ts = int(time.time())
    curr_ts = start_ts

    while curr_ts - start_ts < TIME_LIMIT:
        curr_ts = int(time.time())
        latency = getLatency(LOOKBACK, SERVICE_NAME, HOST_IP)

        if not use_latency:
            workers.apply_async(scale_up)
        elif latency > sensitivity and use_latency:
            workers.apply_async(scale_up)

        times.append(curr_ts - start_ts)
        latencies.append(latency)
        print(str(curr_ts - start_ts) + " s: " + str(latency) + " ms")
        time.sleep(1)

    workers.close()
    workers.join()

    times = np.array(times)
    latencies = np.array(latencies)
    # latencies[latencies < 0] = 0
    np.savetxt('times', times)
    np.savetxt('latencies', latencies)
#    plt.plot(times, latencies)
 #   plt.show()

if __name__ == "__main__":
    run_scaling(500)
