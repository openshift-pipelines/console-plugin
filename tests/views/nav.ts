export const nav = {
  sidenav: {
    switcher: {
      shouldHaveText: (text: string) =>
        /* eslint-disable-next-line cypress/unsafe-to-chain-command */
        cy
          .byLegacyTestID('perspective-switcher-toggle')
          .scrollIntoView()
          .contains(text),
      changePerspectiveTo: (newPerspective: string) =>
        /* eslint-disable-next-line cypress/unsafe-to-chain-command */
        cy
          .byLegacyTestID('perspective-switcher-toggle')
          .click()
          .byLegacyTestID('perspective-switcher-menu-option')
          .contains(newPerspective)
          .click(),
    },
    clusters: {
      shouldHaveText: (text: string) =>
        cy.byLegacyTestID('cluster-dropdown-toggle').contains(text),
      changeClusterTo: (newCluster: string) =>
        /* eslint-disable-next-line cypress/unsafe-to-chain-command */
        cy
          .byLegacyTestID('cluster-dropdown-toggle')
          .click()
          .byLegacyTestID('cluster-dropdown-item')
          .contains(newCluster)
          .click(),
    },
    shouldHaveNavSection: (path: string[]) => {
      cy.get('#page-sidebar').contains(path[0]);
      if (path.length === 2) {
        cy.get('#page-sidebar').contains(path[1]);
      }
    },
    shouldNotHaveNavSection: (path: string[]) => {
      cy.get('#page-sidebar').should('not.have.text', path[0]);
      if (path.length === 2) {
        cy.get('#page-sidebar').should('not.have.text', path[1]);
      }
    },
    clickNavLink: (path: string[]) => cy.clickNavLink(path),
  },
};
