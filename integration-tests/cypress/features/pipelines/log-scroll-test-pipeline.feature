@pipelines
Feature: log-scroll-test-pipeline
              As a user, I want to create a pipeline and pipeline run using oc commands and then navigate to the logs tab to verify all tasks are available and if step name is present in the url then scroll to that step in the logs tab.

        Background:
            Given user is at Administrator perspective
              And user clicks on Pipelines Tab
              And user has created or selected namespace "aut-pipelines"

        @smoke
        Scenario:Create and start pipeline using CLI: LS-01-TC01
             When user creates pipeline run using YAML and CLI "testData/multistep-yaml-log-scroll/log-scroll-test-pipeline.yaml" in namespace "aut-pipelines"
             Then pipeline "log-scroll-test-pipeline" should be created successfully in namespace "aut-pipelines"

        @smoke
        Scenario: Create pipeline run using oc commands: LS-01-TC02
            Given user clicks on Pipelines Tab
              And user has created or selected namespace "aut-pipelines"
             When user creates pipeline run using YAML and CLI "testData/multistep-yaml-log-scroll/log-scroll-test-pipeline-run.yaml" in namespace "aut-pipelines"
             Then pipeline run "log-scroll-test-pipeline-run" should be created successfully in namespace "aut-pipelines"

        @smoke
        Scenario: Access logs tab and verify all tasks are available: LS-01-TC03
            Given user is at pipeline run details page for "log-scroll-test-pipeline-run" in namespace "aut-pipelines"
             When user navigates to Logs Tab for "log-scroll-test-pipeline-run" in namespace "aut-pipelines"
             Then user should see "frontend-build" task in task list
              And user should see "backend-build" task in task list

        @smoke
        Scenario: Scroll to step in logs tab using URL: LS-01-TC04
            Given user tries to navigate to task "task-4" and step "step-9" in Logs tab using URL for "log-scroll-test-pipeline-run" in namespace "aut-pipelines"
             Then user should see "STEP-STEP-9" step is visible in logs tab

        @smoke
        Scenario: Scroll to last step of last task using URL: LS-01-TC05
            Given user tries to navigate to task "task-5" and step "step-10" in Logs tab using URL for "log-scroll-test-pipeline-run" in namespace "aut-pipelines"
             Then user should see "STEP-STEP-10" step is visible in logs tab

        @regression
        Scenario: Invalid step name in existing task using URL: LS-01-TC06
            Given user tries to navigate to task "task-4" and step "step-50" in Logs tab using URL for "log-scroll-test-pipeline-run" in namespace "aut-pipelines"
             Then user should expect default behavior of log viewer and scroll to end of log

        @regression
        Scenario: Missing step parameter in URL defaults to first step: LS-01-TC10
            Given user tries to navigate to task "backend-build" and step "" in Logs tab using URL for "log-scroll-test-pipeline-run" in namespace "aut-pipelines"
             Then user should see "backend-build" task in task list
              And user should expect default behavior of log viewer and scroll to end of log