import { guidedTour } from './guided-tour';

export const checkDeveloperPerspective = () => {
  cy.get('body').then(($body) => {
    cy.byLegacyTestID('perspective-switcher-toggle').then(($switcher) => {
      // switcher is present
      if ($switcher.attr('aria-hidden') !== 'true') {
        cy.byLegacyTestID('perspective-switcher-toggle').click();

        // eslint-disable-next-line prettier/prettier
        if (
          $body.find('[data-test-id="perspective-switcher-menu-option"]')
            .length !== 0
        ) {
          cy.log('perspective switcher menu enabled');
          cy.byLegacyTestID('perspective-switcher-menu-option').contains(
            'Developer',
          );
          cy.byLegacyTestID('perspective-switcher-toggle').click();
          return;
        }
      }

      cy.exec(
        `oc patch console.operator.openshift.io/cluster --type='merge' -p '{"spec":{"customization":{"perspectives":[{"id":"dev","visibility":{"state":"Enabled"}}]}}}'`,
        { failOnNonZeroExit: true },
      ).then((result) => {
        cy.log(result.stderr);
      });
      cy.reload(true);
      cy.document().its('readyState').should('eq', 'complete');
      cy.exec(`  oc rollout status -w deploy/console -n openshift-console`, {
        failOnNonZeroExit: true,
      }).then((result) => {
        cy.log(result.stderr);
      });
      cy.log('perspective switcher menu refreshed');
    });

    guidedTour.close();
  });
};
