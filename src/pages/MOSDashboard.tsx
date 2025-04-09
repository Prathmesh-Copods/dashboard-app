import React, { useMemo } from "react";
import { useMOSDashboardData } from "hooks/useMOSDashboardData";
import MOSDashboardHeader from "components/mos/MOSDashboardHeader";
import IssueDetailsBanner from "components/mos/IssueDetailsBanner";
import NetworkGraphPanel from "components/mos/NetworkGraphPanel";
import RouteDetailPanel from "components/mos/RouteDetailPanel";
import DashboardErrorState from "components/common/DashboardErrorState";

const MemoizedHeader = React.memo(MOSDashboardHeader);
const MemoizedIssueBanner = React.memo(IssueDetailsBanner);
const MemoizedNetworkGraph = React.memo(NetworkGraphPanel);
const MemoizedRouteDetailPanel = React.memo(RouteDetailPanel);

const MOSDashboard: React.FC = () => {
  const {
    dashboardData,
    isLoading,
    isRouteLoading,
    error,
    selectedRouteId,
    selectedSourceId, // Get new state
    availableLocationNames, // Get new state
    selectRoute,
    changeSourceLocation, // Get new function
    locationsMap,
    retryFetch,
  } = useMOSDashboardData();
  
  // Memoize all props before any conditional returns
  // 1. Network Graph props
  const networkGraphProps = useMemo(() => {
    if (!dashboardData) return null;
    return {
      locations: dashboardData.locations,
      routes: dashboardData.routes,
      onRouteSelected: selectRoute,
      selectedRouteId,
      mainDegradationPercentage: dashboardData.issueDetails?.degradationPercentage || 0
    };
  }, [dashboardData, selectedRouteId, selectRoute]);
  
  // 2. Route Detail props
  const routeDetailProps = useMemo(() => {
    if (!dashboardData?.selectedRoute) return null;
    return {
      routeDetails: dashboardData.selectedRoute,
      historicalData: dashboardData.historicalData || [],
      sourceLocationName: locationsMap[dashboardData.selectedRoute.sourceId]?.name || dashboardData.selectedRoute.sourceId,
      destinationLocationName: locationsMap[dashboardData.selectedRoute.destinationId]?.name || dashboardData.selectedRoute.destinationId,
    };
  }, [dashboardData?.selectedRoute, dashboardData?.historicalData, locationsMap]);

  // 3. Header props
  const headerProps = useMemo(() => {
    return {
      serviceName: dashboardData?.serviceInfo?.name || ''
    };
  }, [dashboardData?.serviceInfo?.name]);

  // 4. Issue Banner props
  const issueBannerProps = useMemo(() => {
    if (!dashboardData?.issueDetails) return null;
    return {
      mainNode: locationsMap[selectedSourceId]?.name || selectedSourceId, // Use selected source name
      degradationPercentage: dashboardData.issueDetails.degradationPercentage,
      application: dashboardData.issueDetails.application,
      vlan: dashboardData.issueDetails.vlan,
      codec: dashboardData.issueDetails.codec,
      availableLocations: availableLocationNames, // Pass available location names
      onLocationChange: (locationName: string) => { // Pass handler
        // Find the location ID by name from the map
        const location = Object.values(locationsMap).find(loc => loc.name === locationName);
        if (location) {
          changeSourceLocation(location.id); // Call hook function with ID
        } else {
          console.warn(`Location ID not found for name: ${locationName}`);
        }
      }
    };
    // Add dependencies for the new props and handler
  }, [
    dashboardData?.issueDetails, 
    selectedSourceId, 
    availableLocationNames, 
    locationsMap, 
    changeSourceLocation
  ]);

  // Loading state handling
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error handling
  if (error) {
    const errorMessage = error || "An unknown error occurred.";
    return <DashboardErrorState error={errorMessage} onRetry={retryFetch} />;
  }

  // No data handling
  if (!dashboardData) {
    return (
      <div className="p-8 text-center bg-white text-black">
        No data available.
      </div>
    );
  }

  return (
    // Main container uses white background, black text
    <div className="min-h-screen bg-white text-black mos-dashboard flex flex-col">
      {/* Header - Full width */}
      <MemoizedHeader {...headerProps} />

      {/* Main Content Area below header - approximating 45/55 split */}
      <div className="flex-grow flex flex-row">
        {/* Left Column - approximately 45% width */}
        <div className="w-5/12 flex flex-col border-r border-gray-200">
          {/* Issue Banner in top row */}
          {issueBannerProps && (
            <div className="w-full">
              <MemoizedIssueBanner {...issueBannerProps} />
            </div>
          )}
          
          {/* Network Graph in bottom row - takes remaining height */}
          <div className="flex-grow p-4">
            {networkGraphProps && <MemoizedNetworkGraph {...networkGraphProps} />}
          </div>
        </div>

        {/* Right Column - approximately 55% width */}
        <div className="w-7/12 overflow-y-auto">
          {isRouteLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : dashboardData?.selectedRoute && routeDetailProps ? (
            <MemoizedRouteDetailPanel {...routeDetailProps} />
          ) : (
            <div className="h-full flex items-center justify-center text-black">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-4">
                  Select a route on the network graph to view details
                </p>
                <p className="text-gray-400">
                  Click on any connection line or destination node
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MOSDashboard;
