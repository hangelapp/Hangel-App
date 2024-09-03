import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/providers/profile_page_provider.dart';
import 'package:hangel/widgets/date_picker_widget.dart';
import 'package:hangel/widgets/dropdown_widget.dart';
import 'package:hangel/widgets/form_field_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/toast_widgets.dart';
import 'package:provider/provider.dart';

class UserInformationForm extends StatefulWidget {
  const UserInformationForm({Key? key}) : super(key: key);

  @override
  State<UserInformationForm> createState() => _UserInformationFormState();
}

class _UserInformationFormState extends State<UserInformationForm> {
  final List<String> _genderList = ['Erkek', 'Kadın', 'Belirtmek İstemiyorum'];
  String? _selectedGender = HiveHelpers.getUserFromHive().gender;
  final TextEditingController _nameController = TextEditingController(text: HiveHelpers.getUserFromHive().name ?? '');
  final TextEditingController _emailController = TextEditingController(text: HiveHelpers.getUserFromHive().email ?? '');
  final TextEditingController _doorAndHomeNumber =
      TextEditingController(text: HiveHelpers.getUserFromHive().doorAndHomeNumber ?? '');
  // final DateTime? _birthDate = HiveHelpers.getUserFromHive().birthDate;
  String? selectedIl = HiveHelpers.getUserFromHive().city;
  String? selectedIlce = HiveHelpers.getUserFromHive().district;
  String? selectedMahalle = HiveHelpers.getUserFromHive().neighberhood;
  DateTime? correctDateTime;
  List<String> iller = [];
  List<String> ilceler = [];
  List<String> mahalleler = [];
  String jsonData = "";
  @override
  void initState() {
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      // context.read<LoginRegisterPageProvider>().selectedDate["0"] =
      //     HiveHelpers.getUserFromHive().birthDate ?? DateTime.now();
      //get iller from json file /assets/il-ilce.json
      jsonData = await DefaultAssetBundle.of(context).loadString("assets/il-ilce.json");
      setState(() {
        final jsonResult = jsonDecode(jsonData);
        for (var item in jsonResult) {
          if (iller.contains(item["İL"])) {
            continue;
          }
          iller.add(item["İL"]);
        }
        if (selectedIl != null && selectedIl!.isNotEmpty) {
          final jsonResult = jsonDecode(jsonData);
          for (var item in jsonResult) {
            if (item["İL"] == selectedIl) {
              if (ilceler.contains(item["İLÇE"])) {
                continue;
              }
              ilceler.add(item["İLÇE"]);
            }
          }

          if (selectedIlce != null && selectedIlce!.isNotEmpty) {
            final jsonResult = jsonDecode(jsonData);
            for (var item in jsonResult) {
              if (item["İLÇE"] == selectedIlce) {
                if (mahalleler.contains(item["MAHALLE"])) {
                  continue;
                }
                mahalleler.add(item["MAHALLE"]);
              }
            }
          }
        }
      });
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    // _birthDate == context.watch<LoginRegisterPageProvider>().selectedDate["0"];
    correctDateTime = context.watch<LoginRegisterPageProvider>().correctDateTime;
    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: deviceWidthSize(context, 20),
        ),
        child: Column(
          children: [
            FormFieldWidget(
              context,
              title: 'Ad Soyad',
              controller: _nameController,
              keyboardType: TextInputType.name,
            ),
            DropdownWidget(
              context,
              title: 'Cinsiyet',
              selectedIndex: _genderList.indexOf(_selectedGender ?? ''),
              onChanged: (value) {
                setState(() {
                  _selectedGender = value;
                });
              },
              titles: _genderList,
            ),
            FormFieldWidget(
              context,
              title: 'E-posta',
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
            ),
            const DatePickerWidget(
              title: 'Doğum Tarihi',
              id: 0,
            ),
            DropdownWidget(
              context,
              titles: iller,
              selectedIndex: iller.indexOf(selectedIl ?? ""),
              onChanged: (value) {
                setState(() {
                  selectedIl = value;
                  selectedIlce = null;
                  selectedMahalle = null;
                  ilceler = [];
                  mahalleler = [];
                  final jsonResult = jsonDecode(jsonData);
                  for (var item in jsonResult) {
                    if (item["İL"] == selectedIl) {
                      if (ilceler.contains(item["İLÇE"])) {
                        continue;
                      }
                      ilceler.add(item["İLÇE"]);
                    }
                  }
                });
              },
              title: "İl",
            ),
            if (selectedIl != null)
              DropdownWidget(
                context,
                titles: ilceler,
                selectedIndex: ilceler.indexOf(selectedIlce ?? ""),
                onChanged: (value) {
                  setState(() {
                    selectedIlce = value;
                    selectedMahalle = null;
                    mahalleler = [];
                    final jsonResult = jsonDecode(jsonData);
                    for (var item in jsonResult) {
                      if (item["İLÇE"] == selectedIlce) {
                        if (mahalleler.contains(item["MAHALLE"])) {
                          continue;
                        }
                        mahalleler.add(item["MAHALLE"]);
                      }
                    }
                  });
                },
                title: "İlçe",
              ),
            if (selectedIlce != null)
              DropdownWidget(
                context,
                titles: mahalleler,
                selectedIndex: mahalleler.indexOf(selectedMahalle ?? ""),
                onChanged: (value) {
                  setState(() {
                    selectedMahalle = value;
                  });
                },
                title: "Mahalle",
              ),
            if (selectedMahalle != null)
              FormFieldWidget(
                context,
                title: 'Sokak,Kapı ve Daire No',
                controller: _doorAndHomeNumber,
                keyboardType: TextInputType.text,
              ),
            GeneralButtonWidget(
              onPressed: () {
                UserModel userModel = HiveHelpers.getUserFromHive();
                // if (_birthDate != DateTime.now()) {
                //   userModel.birthDate = _birthDate;
                // }
                if (!(_nameController.text.length >= 4)) {
                  ToastWidgets.errorToast(context, "İsim 4 harften büyük olmalıdır");
                  return;
                }
                userModel.name = _nameController.text;
                userModel.birthDate = correctDateTime;
                userModel.city = selectedIl;
                userModel.district = selectedIlce;
                userModel.neighberhood = selectedMahalle;
                userModel.doorAndHomeNumber = _doorAndHomeNumber.text;
                userModel.email = _emailController.text;
                userModel.gender = _selectedGender ?? '';
                context.read<ProfilePageProvider>().updateProfile({
                  "name": _nameController.text,
                  'birthDate': correctDateTime,
                  'city': selectedIl.toString(),
                  'district': selectedIlce.toString(),
                  'neighberhood': selectedMahalle.toString(),
                  'email': _emailController.text,
                  "doorAndHomeNumber": _doorAndHomeNumber.text,
                  'gender': _selectedGender ?? '',
                }, userModel).then((value) {
                  if (value.success == true) {
                    Navigator.pop(context);
                  }
                  ToastWidgets.responseToast(context, value);
                });
              },
              text: 'Kaydet',
            ),
            SizedBox(
              height: deviceHeightSize(context, 30) + MediaQuery.of(context).viewInsets.bottom,
            ),
          ],
        ),
      ),
    );
  }
}
