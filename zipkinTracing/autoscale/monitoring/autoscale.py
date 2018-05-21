from domonit.containers import Containers
from domonit.ids import Ids
from domonit.inspect import Inspect
from domonit.logs import Logs
from domonit.process import Process
from domonit.changes import Changes
from domonit.stats import Stats

import subprocess
import docker
import traceback

MEMORY_SWAP_ERROR = "Memory limit should be smaller than already set memoryswap limit, update the memoryswap at the same time"

def increase_container_memory(container_name, new_limit):
    update_process = subprocess.run(['docker', 'update', '--memory', str(new_limit), container_name], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if update_process.returncode != 0:
        if MEMORY_SWAP_ERROR.encode() in update_process.stderr:
            update_process = subprocess.run(['docker', 'update', '--memory-swap', str(new_limit), '--memory', str(new_limit), container_name], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # client = docker.from_env()
    # working_container = client.containers.get(container_name)
    # try:
    #     working_container.update(mem_limit=new_limit, memswap_limit=new_limit)
    #
    # except docker.errors.APIError as e:
    #     traceback.print_exc(e)

def increase_cpu_cores(container_name, new_cpus_limit):
    client = docker.from_env()
    working_container = client.containers.get(container_name)

    try:
        working_container.update(cpus=new_cpus_limit)

    except docker.errors.APIError as e:
        traceback.print_exc(e)

def autoscale(mem_threshold, cpu_threshold):
    containers = Containers()
    ids = Ids()

    print(("Number of containers is : %s " % (sum(1 for i in ids.ids()))))

    while True:
        for container_id in ids.ids():
            ins = Inspect(container_id)
            sta = Stats(container_id)
            proc = Process(container_id, ps_args = "aux")

            # Container name
            print("#Container name")
            print((ins.name()))

            # Container id
            print("#Container id")
            print((ins.id()))

            # Memory usage
            mem_u = sta.memory_stats_usage()
            mem_l = sta.memory_stats_limit()
            mem_usage = int(mem_u)/int(mem_l)

            # Memory usage %
            print("#Memory usage %")
            print(mem_usage * 100)

            if mem_usage >= mem_threshold:
                print("INCREASNING MEMORY")
                increase_container_memory(ins.name(), int(mem_l) * 1.5)
# lowest utiilization share cores
            # CPU usage
            user_cpu_usage = sta.cpu_stats_total_usage()
            total_usage = sta.cpu_stats_system_cpu_usage()
            cpu_usage = int(user_cpu_usage) / int(total_usage)

            if cpu_usage >= cpu_threshold:
                increase_cpu_cores(ins.name(), )

            print("#CPU Usage %")
            print(cpu_usage * 100)
            print("")

if __name__ == "__main__":
    autoscale(0.6, 0.8)
