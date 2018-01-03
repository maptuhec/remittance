pragma solidity ^0.4.18;

contract Remittance {

	address public owner;
	address public bob;
	address public carol;
	uint public etherForTransfer;
	
	event LogKillContract(address sender);
	event LogEtherForTransferAdded(address sender, uint amount);

	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}
	function createPassHash(bytes32 pass1, bytes32 pass2) 
	public
	constant
	onlyOwner
	returns(bytes32 passHash) 
	{
		return keccak256(pass1,pass2);
	}

	function challenge(bytes32 password) public payable onlyOwner {
		require(password != 0);
		etherForTransfer = msg.value;
		LogEtherForTransferAdded(owner,msg.value);
	}

	function transferEther() {

	};

	function killSwitch() public onlyOwner {
        LogKillContract(owner);
        selfdestruct(owner);
    }
}