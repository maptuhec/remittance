pragma solidity ^0.4.18;

contract Remittance {

	address public owner;

	mapping (bytes32 => Account ) public accounts;

	struct Account {
		bytes32 passHash;
		uint etherForTransfer;
		uint balance;
	}
	
	event LogKillContract(address sender);
	event LogEtherForTransferAdded(address sender, uint amount);
	event LogTransferEther(address sender);
	event LogWithdraw(address sender);

	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}

	modifier passwordsAvailable(bytes32 pass1, bytes32 pass2) {
		require(pass1 != 0);
		require(pass2 != 0);
		_;
	}

	function createPassHash(bytes32 pass1, bytes32 pass2) 
	public
	constant
	onlyOwner
	passwordsAvailable(pass1,pass2)
	{
	return keccak256(pass1,pass2);
	}

	function challenge(bytes32 password) public payable onlyOwner {
		require(password != 0);
		require(msg.value > 0);
		accounts[password].passHash = password;
		accounts[etherForTransfer] = msg.value;
		LogEtherForTransferAdded(owner,msg.value);
	}

	function transferEther(bytes32 pass1, bytes32 pass2) public passwordsAvailable(pass1,pass2) {
		require(accounts[keccak256(pass1,pass2)].passHash == keccak256(pass1,pass2));
		accounts[keccak256(pass1,pass2)].balance == accounts[keccak256(pass1,pass2)].etherForTransfer;
	}

	function withdraw() public {
        require(balances[msg.sender] > 0);
        uint valueToWithdraw = balances[msg.sender];
        balances[msg.sender] = 0;
        msg.sender.transfer(valueToWithdraw);
        
        LogWithdraw(msg.sender);
    }

	function killSwitch() public onlyOwner {
        LogKillContract(owner);
        selfdestruct(owner);
    }
}