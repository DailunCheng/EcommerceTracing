import numpy as np
import matplotlib.pyplot as plt

times = np.loadtxt('times')
latencies = np.loadtxt('latencies')

plt.plot(times, latencies)
plt.xlabel('Time (s)')
plt.ylabel('Latency (ms)')
plt.title('End-to-End latency of frontend_cart with 10,000 requests, 2 clients')
plt.show()
