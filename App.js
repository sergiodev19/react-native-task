import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import CheckBox from "react-native-check-box";

const configUrl =
  "https://9fd21a03-38a1-4e35-9cea-a97bcfc00f4b.mock.pstmn.io/reg";

const DynamicForm = ({ config }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const submit = async (data) => {
    return fetch(configUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  };

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateInput = (element, value) => {
    for (let validator of element.validator) {
      switch (validator.type) {
        case "length":
          if (validator.operator === "gt" && value.length <= validator.value) {
            return `Value of ${element.label} field must be longer than ${validator.value} characters`;
          }
          if (validator.operator === "gte" && value.length < validator.value) {
            return `Value of ${element.label} field must be at least ${validator.value} characters long`;
          }
          break;

        case "pattern":
          const regex = new RegExp(validator.regexp);
          if (!regex.test(value)) {
            return `Invalid format for ${element.label} field`;
          }
          break;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    let validationErrors = {};
    let hasErrors = false;

    config.blueprint.forEach((block) => {
      if (block.type === "row") {
        block.columns.forEach((column) => {
          column.elements.forEach((element) => {
            if (element.validator) {
              const error = validateInput(
                element,
                formData[element.name] || "",
              );
              if (error) {
                validationErrors[element.name] = error;
                hasErrors = true;
              }
            }
            if (element.required && !formData[element.name]) {
              validationErrors[element.name] = `${element.label} is required`;
              hasErrors = true;
            }
          });
        });
      }
    });

    if (hasErrors) {
      setErrors(validationErrors);
      return Alert.alert(
        "Validation Error",
        "Please correct the errors in the form",
      );
    }

    setErrors({});

    try {
      await submit(formData);
      Alert.alert("Success", "Form submitted successfully");
      setFormData({});
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert("Error", "An error occurred while submitting the form");
    }
  };

  const renderElement = (element, key) => {
    switch (element.type) {
      case "heading":
        return (
          <Text key={key} style={styles.heading}>
            {element.value}
          </Text>
        );
      case "paragraph":
        return <Text key={key}>{element.value}</Text>;
      case "input":
        return (
          <View key={key}>
            <Text>{element.label}</Text>
            <TextInput
              value={formData[element.name] || ""}
              onChangeText={(text) => handleInputChange(element.name, text)}
              style={styles.input}
            />
            {errors[element.name] && (
              <Text style={styles.errorText}>{errors[element.name]}</Text>
            )}
          </View>
        );
      case "password":
        return (
          <View key={key}>
            <Text>{element.label}</Text>
            <TextInput
              value={formData[element.name] || ""}
              onChangeText={(text) => handleInputChange(element.name, text)}
              style={styles.input}
              placeholder={element.help || ""}
              secureTextEntry={element.type === "password"}
            />
            {errors[element.name] && (
              <Text style={styles.errorText}>{errors[element.name]}</Text>
            )}
          </View>
        );
      case "checkbox":
        return (
          <View key={key} style={styles.checkBoxContainer}>
            <CheckBox
              isChecked={formData[element.name] || false}
              onClick={() =>
                handleInputChange(element.name, !formData[element.name])
              }
            />
            <Text>{element.label}</Text>
          </View>
        );
      case "submit":
        return (
          <Pressable
            key={key}
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            <Text>{element.label}</Text>
          </Pressable>
        );
      default:
        return null;
    }
  };

  const renderColumn = (column, key) => {
    return (
      <View key={key} style={[styles.column, { flex: column.size }]}>
        {column.elements.map(renderElement)}
      </View>
    );
  };

  const renderRow = (row, key) => {
    return (
      <View key={key} style={styles.row}>
        {row.columns.map(renderColumn)}
      </View>
    );
  };

  return (
    <View>
      {config.blueprint.map((block, index) => {
        if (block.type === "block") {
          return block.elements.map(renderElement);
        } else if (block.type === "row") {
          return renderRow(block, index);
        }
        return null;
      })}
    </View>
  );
};

export default function App() {
  const [configs, setConfigs] = useState(null);

  const getConfigs = async () => {
    try {
      const response = await fetch(configUrl);
      const configs = await response.json();
      setConfigs(configs);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getConfigs();
  }, []);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {configs && (
          <Pressable onPress={Keyboard.dismiss} style={styles.container}>
            <DynamicForm config={configs} />
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 10,
    paddingRight: 10,
  },
  heading: {
    fontSize: 20,
  },
  input: {
    borderWidth: 1,
    height: 25,
    padding: 5,
    marginTop: 5,
    marginBottom: 5,
  },
  checkBoxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    color: "red",
  },
  row: {
    flexDirection: "row",
  },
  column: {
    justifyContent: "space-between",
  },
  submitButton: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
});
