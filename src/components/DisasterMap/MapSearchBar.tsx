import { useEffect, useState } from "react";
import { Dimensions, ScrollView, View , Text, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import DelayInput from "react-native-debounce-input";
import { DisasterCard, Location } from "../commons/UserMap";

export const MapSearchBar = (props: { data: DisasterCard[], navigateOnMap: (latLng: Location) => void }) => {
    const [searchKey, setSearchKey] = useState("");
    const [filterList, setFilterList] = useState([] as DisasterCard[]);
  
    const searchResultExists = (searchText: string) => (searchText.toLowerCase().search(searchKey) > -1);
  
    useEffect(() => {
      const key = searchKey.trim();
      if (key.length > 0) {
        const filteredData = props.data.filter((d: DisasterCard) => (searchResultExists(d.hazardName) || searchResultExists(d.disaster) || searchResultExists(d.description)));
        filteredData.length > 0 && setFilterList(filteredData);
      } else {
        setFilterList([] as DisasterCard[]);
      }
    }, [searchKey]);
  
    return (
      <>
        <View style={{
          margin: 20,
          padding: 10,
          flexDirection: "row",
          position: 'absolute',
          zIndex: 2,
          backgroundColor: '#FFFFFF',
          width: Dimensions.get("window").width - 40,
          height: 45, 
          justifyContent: "flex-start", 
          alignItems: "center", 
          top: 30, 
          borderRadius: 20
        }}>
            <Ionicons name="search-outline" size={24} color="#cdcdcd" />
            <DelayInput
                style={{ fontSize: 16, color: "black", textAlign: "left", padding: 3, width: Dimensions.get("window").width - 80, }} 
                placeholder="Search Disasters" 
                onChangeText={key => setSearchKey(key.toString().toLowerCase())}
                value={searchKey}
                clearButtonMode="always"
            />
        </View>
        {
          filterList.length > 0 &&
          <ScrollView 
            style={{
                margin: 20,
                padding: 10,
                flexDirection: "row",
                position: 'absolute',
                zIndex: 2,
                backgroundColor: '#FFFFFF',
                width: Dimensions.get("window").width - 40,
                top: 80, 
                height: 200
            }}
            contentContainerStyle={{
                height: Dimensions.get("window").height
            }}
            scrollsToTop={true}
          >
            {
              filterList.map((f, index) => {
                return (
                    <TouchableWithoutFeedback 
                        key={index} 
                        onPress={() => {
                            props.navigateOnMap(f.latLng);
                            setSearchKey("");
                        }}
                    >
                        <View  
                            style={{ 
                                flex: 1, 
                                flexDirection: 'column', 
                                width: Dimensions.get("window").width - 60, 
                                padding: 10, 
                                maxHeight: 70,
                                minHeight: 70,
                                height: 70
                            }}
                        >
                            <Text style={{ textAlign: "left", fontSize: 16, color: '#000000', lineHeight: 20 }} numberOfLines={1}>{f.hazardName}</Text>
                            <Text style={{ textAlign: "left", fontSize: 12, color: '#858585', lineHeight: 20 }} numberOfLines={1}>{f.description}</Text>
                            <View style={{ borderBottomColor: '#cdcdcd', borderBottomWidth: 1, paddingTop: 10 }} />
                        </View>
                    </TouchableWithoutFeedback>
                );
              })
            }
          </ScrollView>
        }
      </>
    );
};