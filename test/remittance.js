var Remittance = artifacts.require("./Remittance.sol")
const util = require('./utils');
const expectThrow = util.expectThrow;
const currentTime = util.web3Now;
const timeTravel = util.timeTravel

contract('Remittance', function (accounts) {

	var contract;
	var owner = accounts[0];
	var alice = accounts[1];
	var carol = accounts[2];
	var etherValue = 10;
	var deadline = 1;
	var invalidPassHash = '';
	var invalidDeadline = 0;
	var pass1 = 'abcd';
	var pass2 = '1234';
	const day = 24 * 60 * 60;

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
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});
		const account = await contract.accounts(passHash);
		assert.equal(account[0].toString("10"), 10, "Challenge's value is not correct");
		assert.equal(account[1].toString("10"), currentTime(web3) + 1, "Challenge's deadline is not correct");
		assert.equal(account[2], alice, "Challenge's owner account is not correct");
	})

	it("should emit event when creating valid challange", async function () {
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
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
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await expectThrow(contract.challenge(passHash, invalidDeadline, {
			from: alice,
			value: etherValue
		}));
	});

	it("should throw if msg value is not greater than zero", async function () {
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await expectThrow(contract.challenge(passHash, invalidDeadline, {
			from: alice,
			value: 0
		}));
	});

	it("should throw if the password hash already exists", async function () {
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});
		await expectThrow(contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		}));
	})

	//Transfer Ether tests
	it("should transfer the ether to the sender", async function () {
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});
		await contract.transferEther('abcd', '1234', {
			from: carol
		});
		const account = await contract.accounts(passHash);
		assert.equal(account[0].toString("10"), 0, "Accounts's value is greater than zero");
	})

	it("should throw if first password is not correct", async function () {
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});
		await expectThrow(contract.transferEther('abc', '1234', {
			from: carol
		}));
	});

	it("should throw if second password is not correct", async function () {
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});
		await expectThrow(contract.transferEther('abcd', '134', {
			from: carol
		}));
	});

	it("should throw if deadline has passed", async function () {
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});
		await timeTravel(web3, day);
		await expectThrow(contract.transferEther('abcd', '1234', {
			from: carol
		}))
	});

	it("should throw if accounts ether is less than zero", async function () {
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});

		await contract.transferEther('abcd', '1234', {
			from: carol
		});

		await expectThrow(contract.transferEther('abcd', '1234', {
			from: carol
		}));
	})

	it("should emit event when transfer the ether to the sender", async function () {
		const expectedEvent = 'LogTransferEther';
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});

		let result = await contract.transferEther('abcd', '1234', {
			from: carol
		});
		assert.lengthOf(result.logs, 1, "There should be 1 event emitted from killing the contract!");
		assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
	})


	//Withdraw tests

	it("should withdraw the ether to the sender", async function () {
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});
		await timeTravel(web3, day);
		await contract.withdraw(passHash, {
			from: alice
		});
		const account = await contract.accounts(passHash);
		assert.equal(account[0].toString("10"), 0, "Accounts's amount is not greater than zero");
	})

	it("should emit event on withdrawal", async function () {
		const expectedEvent = 'LogWithdraw';
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});
		await timeTravel(web3, day);
		let result = await contract.withdraw(passHash, {
			from: alice
		});
		assert.lengthOf(result.logs, 1, "There should be 1 event emitted from killing the contract!");
		assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
	})

	it("should throw if account's ether is not greater than zero", async function () {
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});
		await contract.transferEther('abcd', '1234', {
			from: carol
		});
		await expectThrow(contract.withdraw(passHash, {
			from: alice
		}));
	})

	it("should throw if the sender is now the owner of the account", async function () {
		const passHash = await contract.createPassHash(pass1, pass2, {
			from: owner
		})
		await contract.challenge(passHash, deadline, {
			from: alice,
			value: etherValue
		});
		await expectThrow(contract.withdraw(passHash, {
			from: carol
		}));
	})

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