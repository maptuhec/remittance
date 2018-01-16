var Remittance = artifacts.require("./Remittance.sol")
const util = require('./utils');
const expectThrow = util.expectThrow;

contract('Remittance', function (accounts) {

	var contract;
	var owner = accounts[0];
	var alice = accounts[1];
	var carol = accounts[2];
	var etherValue = 10;
	var passHash = 'abc123';
	var deadline = 10;
	var invalidPassHash = '';
	var invalidDeadline = 0;

	beforeEach(function () {
		return Remittance.new({
			from: owner
		}).then(function (instance) {
			contract = instance;
		});
	});

	it("should be owned by owner", async function () {
		let _owner = await contract.owner({
			from: owner
		});
		assert.strictEqual(_owner, owner, "contract is not owned by owner");
	});

	//Challange tests
	it("should create valid challange", async function () {
		await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});
		const account = await contract.accounts(passHash);
		assert.equal(account[0].toString("10"), 10, "Challenge's account is not correct");
		assert.equal(account[1].toString("10"), ((Date.now()) / 1000 | 0) + 10, "Challenge's deadline is not correct");
		assert.equal(account[2], alice, "Challenge's owner account is not correct");
	})

	it("should emit event when creating valid challange", async function () {
		const expectedEvent = 'LogChallangeCreated'
		let result = await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});
		assert.lengthOf(result.logs, 1, "There should be 1 event emitted when creating a challange!");
		assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
	})

	it("should throw if password hash is empty", async function () {
		await expectThrow(contract.challenge(invalidPassHash, deadline, {
			from: alice,
			value: etherValue
		}));
	});

	it("should throw if deadline is invalid", async function () {
		await expectThrow(contract.challenge(passHash, invalidDeadline, {
			from: alice,
			value: etherValue
		}));
	});

	it("should throw if msg value is not greater than zero", async function () {
		await expectThrow(contract.challenge(passHash, invalidDeadline, {
			from: alice,
			value: 0
		}));
	});

	//Transfer Ether tests

	//Withdraw tests

	//Killswitch tests
	it("should kill the contract", async function () {
		const killed = await contract.killSwitch({
			from: owner
		});
		assert.equal(!!killed, true, "Contract not killed properly");
	});

	it("should throw and not kill the contract if sender is not the owner", async function () {
		await expectThrow(contract.killSwitch({
			from: alice
		}));
	});

	it("should emit event on kiling the contract", async function () {
		const expectedEvent = 'LogKillContract';
		let result = await contract.killSwitch({
			from: owner
		});

		assert.lengthOf(result.logs, 1, "There should be 1 event emitted from killing the contract!");
		assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
	});

});