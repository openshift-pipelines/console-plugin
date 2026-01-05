@pipelines
Feature: Pipeline metrics
              As a user, I want to see an overall how well my Pipeline Runs have gone and how long they take to run.


        Background:
            Given user has created or selected namespace "aut-pipelines"
              And user is at pipelines page


        @regression
        Scenario: Pipeline metrics dashboard display for no pipeline runs: P-04-TC01
            Given pipeline "pipeline-metrics" is present on Pipeline Details page
             When user clicks on Metrics tab
            #  Then user can see empty page with message "Start your pipeline to view pipeline metrics"
             Then user can see "0/0" in PipelineRun status


        @smoke @broken-test
        Scenario: Graphs in metrics tab: P-04-TC02
            Given pipeline run is displayed for "pipeline-metrics-one" with resource
             When user clicks on pipeline "pipeline-metrics-one"
              And user clicks on Metrics tab
             Then user can see Time Range with a default value of "Last day"
              And user can see and Refresh Interval with a default value of "30 second"
              And user can see PipelineRun status, Number of Pipeline Runs


        @regression
        Scenario: Data in metrics tab: P-04-TC03
            Given user creates pipeline using git named "pipeline-metrics-two"
              And user navigates to Pipelines page
              And user clicks on pipeline "pipeline-metrics-two"
              And user selects option "Start" from Actions menu drop down
              And user adds GIT_REVISION as "main"
              And user starts the pipeline from start pipeline modal
              And user navigates to Pipelines page
              And user clicks on pipeline "pipeline-metrics-two"
              And user clicks on Metrics tab
             Then user can see Time Range with a default value of "Last day"
              And user can see and Refresh Interval with a default value of "30 second"
              And user can see PipelineRun status, Number of Pipeline Runs
              # And user can see message "No datapoints found" inside graphs