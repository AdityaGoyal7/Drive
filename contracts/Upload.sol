// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract Upload {
  
  struct Access{
     address user; 
     bool access; //true or false
  }
  struct UploadedFile {
    string url;
    bool deleted;
  }
  mapping(address=>UploadedFile[]) value;
  mapping(address=>mapping(address=>bool)) ownership;
  mapping(address=>Access[]) accessList;
  mapping(address=>mapping(address=>bool)) previousData;

  function add(address _user,string memory url) external {
      require(_user == msg.sender, "Can only add to your own vault");
      value[_user].push(UploadedFile(url, false));
  }

  function remove(uint index) external {
      require(index < value[msg.sender].length, "Invalid index");
      value[msg.sender][index].deleted = true;
  }

  function allow(address user) external {//def
      ownership[msg.sender][user]=true; 
      if(previousData[msg.sender][user]){
         for(uint i=0;i<accessList[msg.sender].length;i++){
             if(accessList[msg.sender][i].user==user){
                  accessList[msg.sender][i].access=true; 
             }
         }
      }else{
          accessList[msg.sender].push(Access(user,true));  
          previousData[msg.sender][user]=true;  
      }
    
  }
  function disallow(address user) public{
      ownership[msg.sender][user]=false;
      for(uint i=0;i<accessList[msg.sender].length;i++){
          if(accessList[msg.sender][i].user==user){ 
              accessList[msg.sender][i].access=false;  
          }
      }
  }

  function display(address _user) external view returns(string[] memory){
      require(_user==msg.sender || ownership[_user][msg.sender],"You don't have access");
      UploadedFile[] storage files = value[_user];
      uint count = 0;
      
      // Count non-deleted files
      for(uint i = 0; i < files.length; i++){
          if(!files[i].deleted) count++;
      }
      
      string[] memory result = new string[](count);
      uint index = 0;
      for(uint i = 0; i < files.length; i++){
          if(!files[i].deleted){
              result[index] = files[i].url;
              index++;
          }
      }
      return result;
  }

  function shareAccess() public view returns(Access[] memory){
      return accessList[msg.sender];
  }
}