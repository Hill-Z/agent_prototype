# PLDT Home Fiber Troubleshooting Guide

> The content below is for reference only. Do not copy verbatim into replies. Paraphrase based on the current conversation context.

---

## 1. Normal Modem Indicator Light Status

| Light | Normal State | Description |
|--------|---------|------|
| Power | Solid green | Modem power is normal |
| LOS | **Off (no light)** | Fiber signal is normal, no signal loss |
| PON | Solid green | Registered on the PLDT network |
| Internet | Green or blinking green | Internet connection is normal |
| WLAN 2.4G/5G | Solid or blinking green | WiFi is enabled and normal |
| LAN 1-4 | Solid or blinking green | Wired device connected |

---

## 2. No Connection Troubleshooting Steps

> **Remember: Only give the customer one step at a time. Wait for feedback before giving the next step.**

### A1: Check Power Light

**Decision logic:**
- Power light off → Check power cable and outlet, confirm the power switch on the back of the modem is pressed
- Power light orange/red (not green) → Possible modem hardware fault
- Power light green → Continue to next step

**Phrasing reference:**

Ask the customer to check the indicator lights on the front of the modem — see if the Power light is solid green. If not, first make sure the power cable is plugged in and the switch is on.

### A2: Power Cycle (Important: 5 Minutes)

**Key points:**
- Not a quick on/off — must **power off and wait 5 minutes**
- After 5 minutes, turn back on and wait 2-3 minutes for the modem to complete synchronization
- Check if the indicator lights return to normal

**Why 5 minutes?**
A brief power cycle (20-30 seconds) may not be enough to clear the modem cache and complete re-handshaking with the central office equipment. 5 minutes ensures a full disconnection and cool-down.

**Phrasing reference:**

Let's do a proper restart — turn off the power button on the back of the modem, wait about 5 minutes, then turn it back on. This gives the device time to fully disconnect and cool down, which can resolve many issues. After 5 minutes, power it on and wait 2-3 minutes, then check if the lights return to normal.

### A3: Check LOS Light

**Decision logic:**
- LOS off → Normal, continue to next step
- LOS blinking red → Fiber signal unstable, check if fiber cable is firmly connected
- LOS solid red → Fiber signal completely lost, physical line fault

**If LOS red:**
1. Check if the fiber cable is firmly plugged in at both ends (modem end + wall IOO box end)
2. Check if the fiber cable is visibly bent or damaged
3. If still red after checking → Physical line fault, proceed to ticket creation

**Phrasing reference (LOS red):**

If the LOS light is red, that means there's a problem with the fiber line. Can you check the fiber cable — that thin yellow or white cable — and make sure it's firmly plugged in at both ends? One end goes into the modem, the other into the small white box on the wall. Also check that the cable isn't bent too sharply.

If you've checked everything and the light is still red, the issue is likely with the external line, which will need a technician to repair.

### A4: Check PON Light

**Decision logic:**
- PON solid green → Normal, continue to next step
- PON off → No fiber signal, check fiber connection then restart
- PON blinking → Modem is trying to register on the network, wait 2-3 minutes

**Phrasing reference:**

Now check the PON light — it should also be green. If it's off or keeps blinking, first make sure the fiber cable is properly connected, then try restarting.

### A5: Check Internet Light

**Decision logic:**
- Internet green → Network is connected, issue may be on the device side
- Internet off → Modem hasn't obtained an IP, possible account issue or central office problem
- Internet red → Authentication failed, possibly account suspended due to unpaid bill

**Phrasing reference:**

Check if the Internet light is green. If it is, that means the network is actually connected — the issue might be on your computer or phone side. If it's not green, your account may need to be checked — for example, whether there's an outstanding balance.

### A6: Device-Side Troubleshooting

**When all modem lights are normal but still no internet:**

**WiFi vs. Wired isolation:**
First connect your computer directly to the modem's LAN port with an Ethernet cable. If the wired connection works but WiFi doesn't, the issue is with WiFi. If the wired connection also doesn't work, it may be a more complex issue.

**Windows device commands:**
Open Command Prompt (search for cmd), then enter:
```
ipconfig /release
ipconfig /renew
```

**Other suggestions:**
- Forget the WiFi network and reconnect
- Clear browser cache (Ctrl+Shift+Delete)
- Restart your computer/phone

---

## 3. Slow Internet Troubleshooting Steps

### B1: Wired Speed Test

**Key points:**
- Connect computer to modem LAN port with Ethernet cable
- Visit https://www.speedtest.net
- Select a PLDT server
- Only have one device connected during the test
- Compare with expected plan speed

**Plan reference speeds:**
- Plan 1399: Up to ~300 Mbps
- Plan 1699: Up to ~400 Mbps
- Plan 2399: Up to ~500 Mbps
- 1 Gbps Plan: Up to ~1000 Mbps

**Phrasing reference:**

Let's first confirm your actual speed — connect your computer directly to the modem with an Ethernet cable, then go to speedtest.net and run a test. Make sure only that one device is connected during the test for accurate results. Let me know the result and I'll help you compare it against what your plan should deliver.

### B2: Check Connected Devices

Too many devices using the connection at once will divide your bandwidth. Ask the customer to check if any devices are:
- Downloading large files / system updates
- Streaming 4K video / live streams
- Online gaming
- Cloud sync

### B3: Modem Placement Optimization

- Place in an open, well-ventilated, central location
- Don't place on the floor, in a corner, or inside a cabinet
- Keep away from microwaves, refrigerators, and other appliances
- For multi-story homes, place on the upper floor

### B4: Modem Cooling

- If the modem feels hot to the touch → Power off and cool down for 5 minutes
- Keep well ventilated, don't stack items on top
- Place in a cool, airy spot

### B5: WiFi Band Selection

- **5GHz** = Faster speeds but weaker wall penetration, best for devices close to the modem
- **2.4GHz** = Slower speeds but wider coverage, best for devices far from the modem
- It's recommended to name the two band SSIDs separately (e.g., WiFiName and WiFiName_5G)

### B6: Change WiFi Password

Prevents unauthorized users from slowing down your connection. Recommend changing the password regularly.

---

## 4. Situations Requiring Immediate Ticket Creation

The following situations don't require completing all troubleshooting steps — go directly to Stage 3:

1. LOS light stays red (still red after checking cable)
2. PON light keeps blinking for more than 5 minutes
3. Modem Power light is orange/red and restart doesn't help
4. Suspected large-scale area outage
5. Customer has completed all troubleshooting steps without resolution
