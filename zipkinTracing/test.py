import unittest
import json
import query_latency

# Example command runs in cluster:
# curl - X GET "http://128.253.128.66:9411/api/v2/traces?serviceName=orders&lookback=1000000&limit=10" - H "accept: application/json"

class TestQueryLatency(unittest.TestCase):
    # Multiple non-frontend container
    def test_getContainerLatency_1(self):
        f = open("sampleLogs/order_trace_sample.log", "r")
        if f.mode == 'r':
            contents = f.read()
        jsonResult=json.loads(contents)

        container_name = "orders"
        latencyOrder = query_latency.getContainerLatency(container_name,jsonResult)
        expected_result = (902000+19771)/2
        self.assertEqual(round(latencyOrder,-1), round(expected_result,-1))

    # one trace not instrumented in frontend
    def test_getContainerLatency_2(self):
        f = open("sampleLogs/order_trace_sample.log", "r")
        if f.mode == 'r':
            contents = f.read()
        jsonResult = json.loads(contents)

        container_name = "frontend"
        latencyFrontend = query_latency.getContainerLatency(container_name,jsonResult)
        expected_result = 959568
        self.assertEqual(round(latencyFrontend,-1), round(expected_result,-1))

    # Multiple call in frontend container
    def test_getContainerLatency_3(self):
        f = open("sampleLogs/frontend_trace_sample.log", "r")
        if f.mode == 'r':
            contents = f.read()
        jsonResult = json.loads(contents)

        container_name = "frontend"
        latencyFrontend = query_latency.getContainerLatency(container_name,jsonResult)
        expected_result = (3603+4047+7928+8307+7413+4921+5814+5364+6434+4531)/10
        self.assertEqual(round(latencyFrontend,-1), round(expected_result,-1))

    # Multiple calls in one frontend service
    def test_getServiceLatency(self):
        f = open("sampleLogs/frontend_trace_sample.log", "r")
        if f.mode == 'r':
            contents = f.read()
        jsonResult = json.loads(contents)

        service_name = "frontend_helpers_get"
        latencyHelperGet = query_latency.getFrontendServiceLatency(service_name, jsonResult)
        expected_result = (2527+3052+3245)/3
        self.assertEqual(round(latencyHelperGet,-1), round(expected_result,-1))

if __name__ == '__main__':
    unittest.main()
