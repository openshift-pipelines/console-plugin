import { pageTitle } from '../../constants/pageTitle';
import { pipelinesPO } from '../../page-objects';

export const repositoriesPage = {
  verifyTitle: () => {
    cy.byTestID('form-title').should('contain', pageTitle.AddGitRepository);
    cy.testA11y(pageTitle.AddGitRepository);
  },
  verifyRepositoryTableColumns: () => {
    cy.get('[role="grid"] tr th').each(($el) => {
      expect([
        'Name',
        'Event type',
        'Last run',
        'Task status',
        'Last run status',
        'Last run time',
        'Last run duration',
        '',
      ]).contains($el.text());
    });
  },

  verifyNameInRepositoriesTable: (repoName: string) => {
    /* eslint-disable-next-line cypress/unsafe-to-chain-command */
    cy.get(pipelinesPO.search).clear().type(repoName);
    cy.get('[title="Repository"]')
      .next('a')
      .then(($el) => {
        expect($el.text()).match(repoName);
      });
  },
};
