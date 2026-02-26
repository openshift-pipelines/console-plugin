@pipelines @odc-7598
Feature: Data source filter
              As a user, I want to differentiate live and archived data in PipelineRun and TaskRun list pages.

        Background:
            # To run the tests, Red Hat OpenShift Pipelines operator subscription to be updated to refer to main branch of console plugin until this feature is released in operator.
            # To change the subscription to main, follow the below steps
            # Go to Installed operators and select Red Hat OpenShift Pipelines operator
            # Click on Edit subscription in Actions dropdown
            # Add below lines under spec and Save
            # config:
            #    env:
            #       - name: IMAGE_PIPELINES_CONSOLE_PLUGIN
            #         value: 'ghcr.io/openshift-pipelines/console-plugin:main'        
            Given user has created or selected namespace "aut-pipelines"

        @regression @broken-test
        Scenario: Data source filter in PipelineRun list page: DS-01-TC01
            Given user creates PipelineRun and TaskRun resources using YAML editor from 'cypress/testData/pipeline-with-pipelinerun-tasrun.yaml'
             When user navigates to PipelineRun list page
              And user clicks the filter dropdown
             Then user is able to see Data Source filter group
              And user is able to see count in Cluster data

        @regression @broken-test
        Scenario: Data source filter in PipelineRun list in Pipelines details page: DS-01-TC02
             When user navigates to Pipelines list page
              And user selects pipeline "hello-goodbye"
              And user selects PipelineRuns tab
              And user clicks the filter dropdown
             Then user is able to see Data Source filter group
              And user is able to see count in Cluster data

        @regression @broken-test
        Scenario: Data source filter in TaskRun list page: DS-01-TC03
            Given user navigates to TaskRun list page
             When user clicks the filter dropdown
             Then user is able to see Data Source filter group
              And user is able to see count in Cluster data

        @regression @broken-test
        Scenario: Data source filter in TaskRun list in PipelineRuns details page: DS-01-TC04
             When user navigates to Pipelines list page
              And user selects PipelineRun "hello-goodbye-run"
              And user selects TaskRuns tab
              And user clicks the filter dropdown
             Then user is able to see Data Source filter group
              And user is able to see count in Cluster data

        @regression @broken-test
        Scenario: When PipelineRun is archived: DS-01-TC05
            When user navigates to PipelineRun list page
             And user deletes a PipelineRun
            Then user is able to see no count in Cluster data
             And user is able to see count in Archived data

        @regression
        Scenario: When user wants to see archived data: DS-01-TC06
            When user navigates to PipelineRun list page
             And user clicks the filter dropdown
             And user selects Archived data in Data Source filter group
            Then user is able to see the list of Archived data

        @regression @broken-test
        Scenario: Data source filter in PipelineRun list in Repository details page: DS-01-TC07
            Given user created PAC repository and pipelinerun using "<repository_yaml>"
              And user is at repositories page
             When user clicks on the repository "<repository_name>"
              And user selects PipelineRuns tab
              And user clicks the filter dropdown
             Then user is able to see Data Source filter group
              And user is able to see count in Cluster data

        Examples:
                  | repository_yaml                                          | repository_name |
                  | cypress/testData/repository-crd-testdata/repository.yaml | test-repo       |
     