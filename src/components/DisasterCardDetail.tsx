import * as React from "react";
import { 
    StyleSheet,
    Dimensions,
    Text,
    ScrollView,
} from "react-native";
import { DisasterCard } from "../commons/UserMap";
import { Severity } from "../commons/UserMap";

export const DisasterCardToast = (props: { toastData: DisasterCard }) => {
    const lastUpdatedTime = new Date(props.toastData.lastUpdate);
    const severity = props.toastData.severity;
    let color = '#FFFFFF';
    
    if (severity == Severity.ADVISORY) {
        color = '#f3da0b';
    } else if (severity == Severity.WARNING) {
        color = '#f70505';
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{props.toastData.disaster}</Text>
            <Text style={{...styles.severity, color: color}}>{`[${props.toastData.severity}]`}</Text>
            <Text style={styles.hazardName}>{`${props.toastData.hazardName}`}</Text>
            <Text style={styles.descriptionAndTime}>{`Last updated: ${lastUpdatedTime}`}</Text>
            <Text style={styles.descriptionAndTime1}>{props.toastData.description}</Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        width: Dimensions.get("window").width - 40,
        height: 100,
        flex: 1,
        flexDirection: 'column',
        alignSelf: 'center',
        margin: 20,
        padding: 20,
        color: '#FFFFFF',
        backgroundColor: '#222222',
        borderColor: '#e2e4e7',
        borderWidth: 1,
        zIndex: 2,
        position: 'absolute',
        bottom: 100,
        borderRadius: 20
    },
    title: {
        fontSize: 24,
        color: '#977537',
        textAlign: 'center',
        padding: 10
    },
    severity: {
        fontSize: 18,
        textAlign: 'center',
        paddingBottom: 5
    },
    hazardName: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        padding: 8
    },
    descriptionAndTime: {
        fontSize: 12,
        color: '#FFFFFF',
        textAlign: 'left',
        padding: 5,
        lineHeight: 18,
        fontWeight: 'bold'
    },
    descriptionAndTime1: {
        fontSize: 12,
        color: '#FFFFFF',
        textAlign: 'left',
        padding: 5,
        lineHeight: 20,
        fontStyle: 'italic'
    }
});