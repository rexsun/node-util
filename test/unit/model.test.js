describe('util.model', function () {

  describe('# joinCollections()', function () {
    it('join 2 collections should return joint collection', function (done) {
      const inputMajor = [
        { orderId: 1101, content: 'order1', userId: 11 },
        { orderId: 1201, content: 'order2', userId: 12 }
      ];
      const inputAppendix = [
        { user_id: 11, firstName: 'John', lastName: 'Brown', email: 'u11@test.com', extra: '11E' },
        { user_id: 12, firstName: 'White', lastName: 'Wood', email: 'u12@test.com', extra: '12E' },
        { user_id: 13, firstName: 'Jack', lastName: 'Hill', email: 'u13@test.com', extra: '13E' },
      ];
      const expected = [
        {
          orderId: 1101, content: 'order1', userId: 11, customerFirstName: 'John', customerLastName: 'Brown', email: 'u11@test.com',
          appendix: { user_id: 11, firstName: 'John', lastName: 'Brown', email: 'u11@test.com', extra: '11E' }
        },
        {
          orderId: 1201, content: 'order2', userId: 12, customerFirstName: 'White', customerLastName: 'Wood', email: 'u12@test.com',
          appendix: { user_id: 12, firstName: 'White', lastName: 'Wood', email: 'u12@test.com', extra: '12E' }
        }
      ];
      const actual = util.model.joinCollections(
        inputMajor,
        inputAppendix,
        'userId',
        'user_id',
        {
          customerFirstName: 'firstName',
          customerLastName: (o) => (_.get(o, 'lastName')),
          email: null,
          appendix: {},
        }
      );

      assert.deepEqual(actual, expected);

      done();
    });
  });

});
