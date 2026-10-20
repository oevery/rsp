# Receiver protocol ownership

This deployed product supports multiple handset protocols on one receiver. R-A defaults to alpha; a handset reporting H-B requires beta. A target group may contain both protocols. Split packets by observed handset protocol and preserve each group's target IDs. R-B defaults to beta.

Keep ReceiverSession(model, wire), register(handset), and send(targetIdsOrNull, text). Preserve multiple IDs, targeting and broadcast (null targets). Unknown targets reject before any packet is sent. The existing codecs own encoding and are immutable. Preserve required mixed-protocol behavior while assessing genuine simplification opportunities.
