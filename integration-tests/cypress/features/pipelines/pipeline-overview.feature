#  Following tests has been marked broken due to the following issue https://issues.redhat.com/browse/SRVKP-7859
@pipelines @broken-test
Feature: Pipelines overview page
              As a developer, I would like to view pipeline overview page in Administrator view 


        Background:
            Given user is at Administrator perspective
              And user clicks on Pipelines Tab
              And user has created or selected namespace "aut-pipelines-overview"
              And user is at pipelines overview page

        @pre-condition
        Scenario: Background Steps
              And user clicks on Pipelines Tab
              And pipeline named "pipe-one" is available with pipeline run


        @smoke
        Scenario: Pipeline Overview page: P-13-TC01
             When user selects "aut-pipelines-overview" in Project dropdown
              And user selects "Last weeks" in Time Range
              And user selects "5 minute" in Refresh Interval
             Then user can see PipelineRun status, Duration, Total runs, Number of PipelineRuns charts


        @regression
        Scenario: Pipeline details page from overview page task runs: P-13-TC02
             When user selects "aut-pipelines-overview" in Project dropdown
             When user clicks on Pipeline "pipe-one" in pipeline overview table
             Then user will be redirected to Pipeline Details page with header name "pipe-one"


        @regression
        Scenario: Pipeline run details page from overview page task runs: P-13-TC02
             When user selects "aut-pipelines-overview" in Project dropdown
             When user clicks on Total Pipelineruns number of "pipe-one" in pipeline overview table
             Then user will be redirected to Pipeline Details page with pipeline run tab
