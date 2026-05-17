describe('CineBook Smoke Test', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should launch the splash screen and navigate to onboarding', async () => {
    // 1. Check if the splash screen logo and title are visible
    await expect(element(by.id('splash-app-title'))).toBeVisible();

    // 2. Wait for Splash screen transitions (minimum 2s animation in code)
    // We wait up to 5000ms for the onboarding screen title to load
    await waitFor(element(by.id('onboarding-step-title')))
      .toBeVisible()
      .withTimeout(5000);

    // 3. Verify onboarding screen title and controls are visible
    await expect(element(by.id('onboarding-step-title'))).toBeVisible();
    await expect(element(by.id('onboarding-skip-button'))).toBeVisible();

    // 4. Tap the next button to slide to next onboarding step
    await element(by.id('onboarding-next-button')).tap();

    // 5. Tap the skip button to skip onboarding and route to login
    await element(by.id('onboarding-skip-button')).tap();
  });
});
