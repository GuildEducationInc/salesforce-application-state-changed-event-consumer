global.fetch = require('node-fetch');
const { ApprovalError, RevertApprovalError } = require('./errors');

async function query(genesisApplicationId, stateChangedAt, config) {
  const { getAcademicServiceUrl, getApiKey } = config;
  if (config.getConsumerEnabled()) {
    const response = await fetch(getAcademicServiceUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getApiKey()}` },
      body: JSON.stringify({
        query: `mutation {
                      approveApplication(
                      input: {
                          genesisApplicationId: "${genesisApplicationId}",
                          approvedAt: ${stateChangedAt}
                      }) {
                          id
                      }
                  }`,
      }),
    });
    if (response.status !== 200) {
      throw new Error(`Failed to query graphql: ${response.status}.`);
    }
    return await response.json();
  } else {
    console.log('Consumer Disabled: mocking response for query to \'approveApplication\' with inputs: ', { genesisApplicationId, stateChangedAt })
    return {
      data: {
        approveApplication: {
          id: 'mock-platform-application-id'
        }
      }
    }
  }

}

async function approve(genesisApplicationId, stateChangedAt, config) {
  const stateChangedAtString = `"${stateChangedAt}"`;
  const body = await query(genesisApplicationId, stateChangedAtString, config);
  if (body.errors !== undefined) {
    throw new ApprovalError(body);
  }
  const applicationId = body.data.approveApplication.id;
  console.log(`Application: ${applicationId} approved.`);
  return applicationId;
}

async function revertApproval(genesisApplicationId, config) {
  const body = await query(genesisApplicationId, 'null', config);
  if (body.errors !== undefined) {
    throw new RevertApprovalError(body);
  }
  const applicationId = body.data.approveApplication.id;
  console.log(`Application: ${applicationId} reverted.`);
  return applicationId;
}

module.exports = { approve, revertApproval };
