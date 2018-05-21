from domonit.containers import Containers
from domonit.ids import Ids
from domonit.inspect import Inspect
from domonit.logs import Logs
from domonit.process import Process
from domonit.changes import Changes
from domonit.stats import Stats

import json

c = Containers()
i = Ids()

print(("Number of containers is : %s " % (sum(1 for i in i.ids()))))

if __name__ == "__main__":

    for c_id in i.ids():

        ins = Inspect(c_id)
        sta = Stats(c_id)
        proc = Process(c_id, ps_args = "aux")

        # Container name
        print("\n#Container name")
        print((ins.name()))

        # Container id
        print("#Container id")
        print((ins.id()))

        # Memory usage
        mem_u = sta.memory_stats_usage()

        # Memory limit
        mem_l = sta.memory_stats_limit()

        # Memory usage %
        print("#Memory usage %")
        print((int(mem_u)*100/int(mem_l)))

        # # The number of times that a process of the cgroup triggered a "major fault"
        # print(("\n#The number of times that a process of the cgroup triggered a major fault"))
        # print((sta.memory_stats_stats_pgmajfault()))
        #
        # # Same output as ps aux in *nix
        # print("\n#Same output as ps aux in *nix")
        # print((proc.ps()))

        # CPU usage
        print("#CPU Usage")
        cpu_usage = sta.cpu_stats_total_usage()
        total_usage = sta.cpu_stats_system_cpu_usage()
        print((int(cpu_usage) / int(total_usage)) * 100)
        print(sta.cpu_stats_cpu_stats())
