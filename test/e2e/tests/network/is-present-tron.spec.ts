import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import SelectNetworkModal from '../../page-objects/pages/networks/select-network-modal';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import NetworksPage from '../../page-objects/pages/networks/networks-page';
import { TRON_CHAIN_ID, mockTronFeatureFlags } from '../tron/mocks/common-tron';

const TRON_NETWORK_NAME = 'Tron';
const TRON_NILE_NAME = 'Tron Nile';
const TRON_SHASTA_NAME = 'Tron Shasta';

// Anvil is still needed because the extension polls EVM networks even in
// Tron-only flows.
const TRON_LOCAL_NODE_OPTIONS = ['anvil'];

function buildTronNetworkFixture() {
  // Nile/Shasta appear in the home network filter testnets section when
  // showTestNetworks is enabled and tronTestnetsEnabled is on.
  return new FixtureBuilderV2()
    .withPreferencesController({
      preferences: { showTestNetworks: true },
    })
    .build();
}

async function mockTronNetworkFlags(mockServer: Mockttp) {
  return [await mockTronFeatureFlags(mockServer)];
}

const TRON_DEFAULT_WALLET_MANIFEST_FLAGS = {
  remoteFeatureFlags: {
    // Production does not enable the discover button for Tron yet.
    neNetworkDiscoverButton: {
      [TRON_CHAIN_ID]: true,
    },
  },
} as const;

describe('Tron - Network', function (this: Suite) {
  this.timeout(180_000);

  describe('default wallet', function () {
    it('shows Tron in the home network filter', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          localNodeOptions: TRON_LOCAL_NODE_OPTIONS,
          testSpecificMock: mockTronNetworkFlags,
          manifestFlags: TRON_DEFAULT_WALLET_MANIFEST_FLAGS,
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);
          const selectNetworkModal = new SelectNetworkModal(driver);
          const networkFilter = new NetworkFilter(driver);
          await networkFilter.open();
          await selectNetworkModal.checkPageIsLoaded();
          await selectNetworkModal.checkNetworkIsListed(TRON_NETWORK_NAME);
          await selectNetworkModal.close();
        },
      );
    });

    it('selects Tron from the home network filter', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          localNodeOptions: TRON_LOCAL_NODE_OPTIONS,
          testSpecificMock: mockTronNetworkFlags,
          manifestFlags: TRON_DEFAULT_WALLET_MANIFEST_FLAGS,
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);
          const selectNetworkModal = new SelectNetworkModal(driver);
          const networkFilter = new NetworkFilter(driver);

          await networkFilter.open();
          await selectNetworkModal.checkPageIsLoaded();
          await selectNetworkModal.selectNetworkByChainId(TRON_CHAIN_ID);
          await networkFilter.checkLabelIs(TRON_NETWORK_NAME);
        },
      );
    });

    it('shows Tron on the networks page', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: mockTronNetworkFlags,
          localNodeOptions: TRON_LOCAL_NODE_OPTIONS,
          manifestFlags: TRON_DEFAULT_WALLET_MANIFEST_FLAGS,
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);
          const headerNavbar = new HeaderNavbar(driver);
          const networksPage = new NetworksPage(driver);
          const homePage = new HomePage(driver);

          await headerNavbar.openGlobalNetworksMenu();
          await networksPage.checkPageIsLoaded();
          await networksPage.fillNetworkSearchInput(TRON_NETWORK_NAME);
          await networksPage.openNetworkListOptions(TRON_CHAIN_ID);
          await networksPage.checkDiscoverButtonIsVisible();
          // Leave the route directly: the back button is not rendered while
          // the header is in search mode, so navigating home is the reliable
          // way out.
          await homePage.navigateToHome();
        },
      );
    });

    it('shows Tron in the Tokens tab network selector', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          localNodeOptions: TRON_LOCAL_NODE_OPTIONS,
          testSpecificMock: mockTronNetworkFlags,
          manifestFlags: TRON_DEFAULT_WALLET_MANIFEST_FLAGS,
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);
          const home = new HomePage(driver);
          await home.goToTokensTab();
          const selectNetworkModal = new SelectNetworkModal(driver);
          const networkFilter = new NetworkFilter(driver);
          await networkFilter.open();
          await selectNetworkModal.checkPageIsLoaded();
          await selectNetworkModal.checkNetworkIsListed(TRON_NETWORK_NAME);
          await selectNetworkModal.close();
        },
      );
    });
  });

  describe('test networks enabled', function () {
    it('shows Tron testnets when test networks are enabled', async function () {
      await withFixtures(
        {
          fixtures: buildTronNetworkFixture(),
          title: this.test?.fullTitle(),
          localNodeOptions: TRON_LOCAL_NODE_OPTIONS,
          testSpecificMock: mockTronNetworkFlags,
        },
        async ({ driver }: { driver: Driver }) => {
          await login(driver);
          const selectNetworkModal = new SelectNetworkModal(driver);
          const networkFilter = new NetworkFilter(driver);
          await networkFilter.open();
          await selectNetworkModal.checkPageIsLoaded();
          await selectNetworkModal.checkNetworkIsListed(TRON_NILE_NAME);
          await selectNetworkModal.checkNetworkIsListed(TRON_SHASTA_NAME);
          await selectNetworkModal.close();
        },
      );
    });
  });
});
