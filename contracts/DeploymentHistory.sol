// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DeploymentHistory
 * @dev Tracks deployment scan requests and published contract deployment history.
 * Every interaction is executed with gas fee only (no protocol or native token fee required).
 */
contract DeploymentHistory {
    
    struct ScanRequest {
        uint256 requestId;
        address requester;
        address deployer;
        uint256 fromBlock;
        uint256 toBlock;
        uint256 requestedAt;
        bool completed;
        address[] deployedContracts;
        string resultCID;
    }

    uint256 public nextRequestId = 1;
    
    // Mapping from request ID to ScanRequest
    mapping(uint256 => ScanRequest) public requests;

    // Mapping from deployer address to list of request IDs
    mapping(address => uint256[]) public deployerRequests;

    // Mapping from requester address to list of request IDs
    mapping(address => uint256[]) public userRequests;

    // Events
    event DeploymentScanRequested(
        uint256 indexed requestId,
        address indexed requester,
        address indexed deployer,
        uint256 fromBlock,
        uint256 toBlock,
        uint256 timestamp
    );

    event DeploymentResultPublished(
        uint256 indexed requestId,
        address indexed deployer,
        uint256 contractsCount,
        string resultCID,
        uint256 timestamp
    );

    /**
     * @notice Requests a scan of deployments for a specific deployer address and block range.
     * @dev Gas fee only - no native payment required.
     * @param deployer Address of the wallet or factory to inspect.
     * @param fromBlock Starting block of the scan (0 for genesis/any).
     * @param toBlock Ending block of the scan (0 for latest).
     * @return requestId Unique identifier for the scan request.
     */
    function requestDeploymentScan(
        address deployer,
        uint256 fromBlock,
        uint256 toBlock
    ) external returns (uint256 requestId) {
        require(deployer != address(0), "Invalid deployer address");
        if (toBlock > 0 && fromBlock > 0) {
            require(toBlock >= fromBlock, "Invalid block range");
        }

        requestId = nextRequestId++;

        ScanRequest storage req = requests[requestId];
        req.requestId = requestId;
        req.requester = msg.sender;
        req.deployer = deployer;
        req.fromBlock = fromBlock;
        req.toBlock = toBlock;
        req.requestedAt = block.timestamp;
        req.completed = false;

        deployerRequests[deployer].push(requestId);
        userRequests[msg.sender].push(requestId);

        emit DeploymentScanRequested(
            requestId,
            msg.sender,
            deployer,
            fromBlock,
            toBlock,
            block.timestamp
        );
    }

    /**
     * @notice Retrieves details of a specific scan request.
     * @param requestId The ID of the request to fetch.
     * @return The ScanRequest struct.
     */
    function getRequest(uint256 requestId) external view returns (ScanRequest memory) {
        require(requests[requestId].requestId != 0, "Request does not exist");
        return requests[requestId];
    }

    /**
     * @notice Publishes results for a scan request.
     * @dev Gas fee only - no native payment required.
     * @param requestId The ID of the request being fulfilled.
     * @param deployedContracts Array of contract addresses discovered.
     * @param resultCID Optional IPFS CID or metadata string describing the deployment artifacts.
     */
    function publishResult(
        uint256 requestId,
        address[] calldata deployedContracts,
        string calldata resultCID
    ) external {
        ScanRequest storage req = requests[requestId];
        require(req.requestId != 0, "Request does not exist");
        
        req.deployedContracts = deployedContracts;
        req.resultCID = resultCID;
        req.completed = true;

        emit DeploymentResultPublished(
            requestId,
            req.deployer,
            deployedContracts.length,
            resultCID,
            block.timestamp
        );
    }

    /**
     * @notice Returns all request IDs submitted for a deployer.
     */
    function getDeployerRequestIds(address deployer) external view returns (uint256[] memory) {
        return deployerRequests[deployer];
    }

    /**
     * @notice Returns all request IDs submitted by a user.
     */
    function getUserRequestIds(address user) external view returns (uint256[] memory) {
        return userRequests[user];
    }
}

