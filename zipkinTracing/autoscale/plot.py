import numpy as np
import matplotlib.pyplot as plt

latencies = np.loadtxt('latencies')
scale_times = np.loadtxt('scale_times').astype(int)
scale_times2 = np.delete(scale_times, np.argwhere(scale_times >= latencies.shape[0]))

plain_latencies, = plt.plot(latencies[:, 0], latencies[:, 1])
scale_time_latencies, = plt.plot(scale_times2, latencies[:, 1][scale_times2], 'ro')
plt.xlabel('Time (s)')
plt.ylabel('Latency (ms)')
#plt.title('End-to-End latency of orders with 10,000 requests, 2 clients')
plt.legend([plain_latencies, scale_time_latencies], ['Latencies', 'Scale Up Events'])
plt.show()
