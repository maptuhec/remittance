pragma solidity ^0.4.18;

contract Remittance {

	address public owner;

	mapping (bytes32 => Account ) public accounts;

	struct Account {
		bytes32 passHash;
		uint etherForTransfer;
	}
	
	event LogKillContract(address sender);
	event LogEtherForTransferAdded(address sender, uint amount);
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

	function createPassHash(bytes32 pass1, bytes32 pass2) 
	public
	constant
	onlyOwner
	onlyValidPasswords(pass1,pass2)
	returns(bytes32 passHash)
	{
	return keccak256(pass1,pass2);
	}

	function challenge(bytes32 password) public payable onlyOwner {
		require(password != 0);
		require(msg.value > 0);
		accounts[password].passHash = password;
		accounts[password].etherForTransfer = msg.value;
		LogEtherForTransferAdded(owner,msg.value);
	}

	function transferEther(bytes32 pass1, bytes32 pass2) public onlyValidPasswords(pass1,pass2) {
		require(accounts[keccak256(pass1,pass2)].passHash == keccak256(pass1,pass2));
		require(accoints[keccak256(pass1,pass2)].etherForTransfer > 0);
		msg.sender.transfer(accounts[keccak256(pass1,pass2)].etherForTransfer);
		accounts[keccak256(pass1,pass2)].etherForTransfer = 0;
		LogTransferEther(msg.sender);
	}

	function withdraw(bytes32 passHash) public onlyOwner {
		require(accounts[passHash].etherForTransfer > 0);
        owner.transfer(accounts[passHash].etherForTransfer);
        LogWithdraw(owner);
    }

	function killSwitch() public onlyOwner {
        LogKillContract(owner);
        selfdestruct(owner);
    }
}