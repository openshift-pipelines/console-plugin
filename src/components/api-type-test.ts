import * as express from "express";
import { Result } from "../types";

const list_results: Result[] = [];

const app = express();
app.use(express.json());

// get all results
app.get("/v1alpha2/parents/:parent/results", (req, res) => {

  const parent = req.params.parent
  console.log("parent", parent);
  console.log(list_results);
  res.json(list_results);
});

  app.post("/v1alpha2/parents/:parent/results/:result_uid", (req, res) => {

    const result_uid = req.params.result_uid
    console.log("result_id", result_uid);
    const parent = req.params.parent
    console.log("parent", parent);
    const res_Input: Result = req.body;    
  
    list_results.push(res_Input);
    res.status(201).json(res_Input);
  });


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


/* 
SAMPLE POST REQUEST

API Request URL : localhost:3000/v1alpha2/parents/abc/results/8dc0e53f-e9ef-469f-9f2c-aeb30d11067e
API Request Body 

{
  "name": "default/results/640d1af3-9c75-4167-8167-4d8e4f39d403",  
  "uid": "338481c9-3bc6-472f-9d1b-0f7705e6cb8c",  
  "createTime": "2023-03-02T07:26:48.972907Z",  
  "updateTime": "2023-03-02T07:26:54.191114Z",
  "annotations": {},
  "etag": "338481c9-3bc6-472f-9d1b-0f7705e6cb8c-1677742014191114634",
  "summary": {
    "record": "default/results/640d1af3-9c75-4167-8167-4d8e4f39d403/records/640d1af3-9c75-4167-8167-4d8e4f39d403",
    "type": "tekton.dev/v1beta1.TaskRun",
    "startTime": null,
    "endTime": "2023-03-02T07:26:54Z",
    "status": "SUCCESS",
    "annotations": {}
  }
}

SAMPLE GET REQUEST API URL - localhost:3000/v1alpha2/parents/abc/results 

*/
