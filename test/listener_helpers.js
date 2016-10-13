export function expectToHearEvents(hearStub, expectedEvents) {
  expect(hearStub).to.have.callCount(expectedEvents.length)
  expectedEvents.forEach(function([expectedName, expectedData], index) {
    const event = hearStub.args[index][0]
    expect(event.name).to.eql(expectedName)
    if (typeof expectedData === 'function') {
      expectedData(event.data)
    } else {
      expect(event.data).to.eql(expectedData)
    }
  })
}
