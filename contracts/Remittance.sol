pragma solidity ^0.4.18;

contract Remittance {

	address public owner;

	mapping (bytes32 => Account ) public accounts;

	struct Account {
		uint etherForTransfer;
		uint deadline;
		address ownerAddress;
	}
	
	event LogKillContract(address sender);
	event LogChallangeCreated(address sender, uint amount);
	event LogTransferEther(address sender);
	event LogWithdraw(address sender);

	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}

	modifier onlyValidPasswords(bytes32 pass1, bytes32 pass2) {
		require(pass1 != 0);
		require(pass2 != 0);
		_;
	}

	modifier onlyUnusedPass(bytes32 passHash) {
		require (accounts[passHash].deadline == 0);
		_;
	}

	function Remittance() public {
		owner = msg.sender;
	}

	function createPassHash(bytes32 pass1, bytes32 pass2) 
	public
	constant
	onlyOwner
	onlyValidPasswords(pass1,pass2)
	returns(bytes32 passHash)
	{
	return keccak256(pass1,pass2);
	}

	function challenge(bytes32 password, uint deadline) public payable onlyUnusedPass(password) {
		require(password != 0);
		require(msg.value > 0);
		require(deadline > 0);
		accounts[password].etherForTransfer = msg.value;
		accounts[password].deadline = now + deadline;
		accounts[password].ownerAddress = msg.sender;
		LogChallangeCreated(msg.sender, msg.value);
	}

	function transferEther(bytes32 pass1, bytes32 pass2) public onlyValidPasswords(pass1,pass2) {
		var account = accounts[keccak256(pass1,pass2)];
		require(account.etherForTransfer > 0);
		require(now <= account.deadline);
		msg.sender.transfer(account.etherForTransfer);
		account.etherForTransfer = 0;
		LogTransferEther(msg.sender);
	}

	function withdraw(bytes32 passHash) public {
		require(accounts[passHash].etherForTransfer > 0);
		require(now > accounts[passHash].deadline);
		require(accounts[passHash].ownerAddress == msg.sender);
        msg.sender.transfer(accounts[passHash].etherForTransfer);
		accounts[passHash].etherForTransfer = 0;
        LogWithdraw(owner);
    }

	function killSwitch() public onlyOwner {
        LogKillContract(owner);
        selfdestruct(owner);
    }
}