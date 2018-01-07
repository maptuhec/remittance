pragma solidity ^0.4.18;

contract Remittance {

	address public owner;
	address public bob;
	bytes32 private passHash;
	uint public etherForTransfer;

	mapping (address => uint ) public balances;
	
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
		passHash = keccak256(pass1,pass2);
	}

	function challenge(bytes32 password) public payable onlyOwner {
		require(password != 0);
		etherForTransfer = msg.value;
		LogEtherForTransferAdded(owner,msg.value);
	}

	function transferEther(bytes32 pass1, bytes32 pass2) public passwordsAvailable(pass1,pass2) {
		require(passHash == keccak256(pass1,pass2));
		balances[bob] += etherForTransfer;
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