export default {
  routes: [
    {
      method: 'GET',
      path: '/onboarding/test',
      handler: 'onboarding.getPublicStatus',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/onboarding/public-status',
      handler: 'onboarding.getPublicStatus',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/onboarding/system-status',
      handler: 'onboarding.getSystemStatus',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/onboarding/status',
      handler: 'onboarding.getOnboardingStatus',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'POST',
      path: '/onboarding/select-role',
      handler: 'onboarding.selectRole',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/onboarding/profile-form',
      handler: 'onboarding.getProfileForm',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'POST',
      path: '/onboarding/complete-profile',
      handler: 'onboarding.completeProfile',
      config: {
        auth: false,
        policies: []
      }
    }
  ]
}; 